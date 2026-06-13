-- Energize Festival — Support-Ticket-System
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- 1. support_tickets — Container, ein Ticket = ein Anliegen
----------------------------------------------------------------------
create table if not exists public.support_tickets (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  subject               text not null check (length(subject) between 3 and 120),
  category              text check (
    category is null or
    category in ('account', 'ticket', 'cashless', 'wall', 'tech', 'other')
  ),
  status                text not null default 'open' check (
    status in ('open', 'in_progress', 'answered', 'closed')
  ),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_admin_reply_at   timestamptz,
  closed_at             timestamptz
);

create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_idx
  on public.support_tickets (status, created_at) where status != 'closed';

----------------------------------------------------------------------
-- 2. support_messages — eine Konversation pro Ticket
----------------------------------------------------------------------
create table if not exists public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (length(body) between 1 and 4000),
  is_staff    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx
  on public.support_messages (ticket_id, created_at);

----------------------------------------------------------------------
-- 3. RLS
----------------------------------------------------------------------
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

-- User sieht eigene Tickets, Admin alle
drop policy if exists "tickets users see own" on public.support_tickets;
create policy "tickets users see own"
  on public.support_tickets for select
  using (auth.uid() = user_id);

drop policy if exists "tickets admins see all" on public.support_tickets;
create policy "tickets admins see all"
  on public.support_tickets for select
  using (public.is_admin());

drop policy if exists "tickets users insert own" on public.support_tickets;
create policy "tickets users insert own"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

drop policy if exists "tickets admins update all" on public.support_tickets;
create policy "tickets admins update all"
  on public.support_tickets for update
  using (public.is_admin())
  with check (public.is_admin());

-- Messages: User sieht Messages seiner Tickets, Admin alle
drop policy if exists "messages users see own ticket" on public.support_messages;
create policy "messages users see own ticket"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "messages admins see all" on public.support_messages;
create policy "messages admins see all"
  on public.support_messages for select
  using (public.is_admin());

-- User schreibt auf eigenes Ticket (nicht is_staff), solange nicht closed
drop policy if exists "messages users post on own" on public.support_messages;
create policy "messages users post on own"
  on public.support_messages for insert
  with check (
    auth.uid() = author_id
    and is_staff = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and t.user_id = auth.uid()
        and t.status <> 'closed'
    )
  );

-- Admin schreibt auf jedes Ticket (is_staff = true)
drop policy if exists "messages admins post" on public.support_messages;
create policy "messages admins post"
  on public.support_messages for insert
  with check (
    public.is_admin()
    and auth.uid() = author_id
    and is_staff = true
  );

----------------------------------------------------------------------
-- 4. Trigger: Status + Timestamps automatisch pflegen
----------------------------------------------------------------------
create or replace function public.touch_support_ticket()
returns trigger
language plpgsql
as $$
declare
  current_status text;
begin
  select status into current_status from public.support_tickets where id = new.ticket_id;

  update public.support_tickets
     set updated_at = now(),
         last_admin_reply_at = case when new.is_staff then now() else last_admin_reply_at end,
         status = case
           -- Admin antwortet → 'answered' (user kann re-open mit neuer Message)
           when new.is_staff and current_status in ('open', 'in_progress') then 'answered'
           -- User antwortet auf 'answered' → 'in_progress' (wieder bei Admin am Ball)
           when not new.is_staff and current_status = 'answered' then 'in_progress'
           else current_status
         end
   where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists support_message_inserted on public.support_messages;
create trigger support_message_inserted
  after insert on public.support_messages
  for each row execute function public.touch_support_ticket();

----------------------------------------------------------------------
-- 5. admin_close_ticket() — explizit schliessen
----------------------------------------------------------------------
create or replace function public.admin_close_ticket(target_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  update public.support_tickets
     set status = 'closed',
         closed_at = now(),
         updated_at = now()
   where id = target_ticket_id;
end;
$$;

revoke all on function public.admin_close_ticket(uuid) from public, anon;
grant execute on function public.admin_close_ticket(uuid) to authenticated;

----------------------------------------------------------------------
-- 6. admin_reopen_ticket() — Admin kann re-open
----------------------------------------------------------------------
create or replace function public.admin_reopen_ticket(target_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  update public.support_tickets
     set status = 'in_progress',
         closed_at = null,
         updated_at = now()
   where id = target_ticket_id;
end;
$$;

revoke all on function public.admin_reopen_ticket(uuid) from public, anon;
grant execute on function public.admin_reopen_ticket(uuid) to authenticated;

----------------------------------------------------------------------
-- 7. admin_list_open_tickets() — Liste mit Alter + Author-Info
----------------------------------------------------------------------
create or replace function public.admin_list_open_tickets()
returns table (
  id                   uuid,
  subject              text,
  category             text,
  status               text,
  created_at           timestamptz,
  updated_at           timestamptz,
  last_admin_reply_at  timestamptz,
  user_id              uuid,
  user_email           text,
  user_display_name    text,
  message_count        bigint,
  unanswered_age_hours numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    t.id,
    t.subject,
    t.category,
    t.status,
    t.created_at,
    t.updated_at,
    t.last_admin_reply_at,
    t.user_id,
    u.email::text,
    p.display_name,
    (select count(*) from public.support_messages m where m.ticket_id = t.id),
    extract(epoch from (now() - t.updated_at)) / 3600.0
  from public.support_tickets t
  join auth.users u on u.id = t.user_id
  join public.profiles p on p.id = t.user_id
  where public.is_admin()
    and t.status <> 'closed'
  order by
    case when t.status = 'open' or t.status = 'in_progress' then 0 else 1 end,
    t.updated_at asc
  limit 200;
$$;

revoke all on function public.admin_list_open_tickets() from public, anon;
grant execute on function public.admin_list_open_tickets() to authenticated;

----------------------------------------------------------------------
-- 8. Notification-Queue: spaeter eine Edge Function pickt das ab
--    und schickt die Mail per SMTP. Erstmal nur als Tabelle.
----------------------------------------------------------------------
create table if not exists public.outbound_emails (
  id          uuid primary key default gen_random_uuid(),
  to_email    text not null,
  subject     text not null,
  body_text   text not null,
  body_html   text,
  sent_at     timestamptz,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists outbound_emails_pending_idx
  on public.outbound_emails (created_at) where sent_at is null;

alter table public.outbound_emails enable row level security;
-- Nur service_role darf lesen/schreiben (= Edge Function),
-- kein User-Zugriff. Daher KEINE Policies fuer authenticated.

-- Wenn Admin antwortet → outbound_emails-Row anlegen
create or replace function public.queue_support_reply_mail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_row    record;
  user_email    text;
  user_name     text;
begin
  if not new.is_staff then return new; end if;

  select t.subject, t.user_id into ticket_row
    from public.support_tickets t where t.id = new.ticket_id;

  select u.email::text, p.display_name into user_email, user_name
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = ticket_row.user_id;

  if user_email is null then return new; end if;

  insert into public.outbound_emails (to_email, subject, body_text)
  values (
    user_email,
    'Energize Support · Antwort auf "' || ticket_row.subject || '"',
    'Hi ' || coalesce(user_name, 'Energizer') || ',' || E'\n\n' ||
    'wir haben dir gerade auf dein Support-Ticket geantwortet. ' ||
    'Lies die Antwort hier:' || E'\n\n' ||
    'https://energize.blackout42.de/account/' || E'\n\n' ||
    'Energize Crew'
  );

  return new;
end;
$$;

drop trigger if exists queue_mail_on_admin_reply on public.support_messages;
create trigger queue_mail_on_admin_reply
  after insert on public.support_messages
  for each row
  when (new.is_staff)
  execute function public.queue_support_reply_mail();
