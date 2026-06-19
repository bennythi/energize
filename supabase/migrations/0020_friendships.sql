-- Energize Festival — Freundschaften mit Bestaetigung
-- Stand: 2026-06-19
--
-- Modell:
--   - Bidirektional. Pro User-Paar (low, high) genau eine Zeile, egal
--     wer angefragt hat.
--   - status: pending | accepted | declined
--   - requester_id sagt, wer die aktuelle/letzte Anfrage gestellt hat.
--     Nur der ANDERE (addressee) darf accept/decline.
--   - Wenn A schon B angefragt hat (pending) und B fragt A an, wird
--     die Freundschaft automatisch accepted.
--   - Bei accept queued ein Trigger eine Mail in outbound_emails.
--
-- Eine Edge Function (siehe docs/supabase-email-templates) picked die
-- Queue ab und versendet per SMTP. Solange die Edge Function nicht
-- laeuft, sammeln sich die Mails in outbound_emails.

----------------------------------------------------------------------
-- 1. friendships
----------------------------------------------------------------------
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  user_low      uuid not null references public.profiles(id) on delete cascade,
  user_high     uuid not null references public.profiles(id) on delete cascade,
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint friendships_pair_ordered check (user_low < user_high),
  constraint friendships_requester_in_pair check (
    requester_id = user_low or requester_id = user_high
  ),
  unique (user_low, user_high)
);

create index if not exists friendships_low_idx
  on public.friendships (user_low, status);
create index if not exists friendships_high_idx
  on public.friendships (user_high, status);

----------------------------------------------------------------------
-- 2. RLS: Beide Beteiligte sehen den Eintrag, andere nicht
----------------------------------------------------------------------
alter table public.friendships enable row level security;

drop policy if exists "friendships_self_select" on public.friendships;
create policy "friendships_self_select"
  on public.friendships for select
  using (auth.uid() = user_low or auth.uid() = user_high);

-- INSERT/UPDATE/DELETE laufen nur ueber RPCs (security definer), keine
-- direkten Policies.

----------------------------------------------------------------------
-- 3. friend_request_send(target_user_id) RPC
----------------------------------------------------------------------
create or replace function public.friend_request_send(target_user_id uuid)
returns table (
  id      uuid,
  status  text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller          uuid := auth.uid();
  low_uid         uuid;
  high_uid        uuid;
  existing        record;
  target_email    text;
  target_name     text;
  caller_name     text;
  caller_handle   text;
  result_id       uuid;
  result_status   text;
begin
  if caller is null then
    raise exception 'Nicht authentifiziert' using errcode = '42501';
  end if;
  if target_user_id is null or target_user_id = caller then
    raise exception 'Ungueltiger Empfaenger' using errcode = '22023';
  end if;

  -- Pruefen ob Target existiert
  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'User nicht gefunden' using errcode = 'P0002';
  end if;

  low_uid  := least(caller, target_user_id);
  high_uid := greatest(caller, target_user_id);

  select * into existing
    from public.friendships
    where user_low = low_uid and user_high = high_uid;

  if existing.id is not null then
    if existing.status = 'accepted' then
      raise exception 'Ihr seid bereits Freunde' using errcode = '23505';
    elsif existing.status = 'pending' then
      if existing.requester_id = caller then
        raise exception 'Anfrage laeuft bereits' using errcode = '23505';
      else
        -- Gegenseite hatte schon angefragt, jetzt automatisch akzeptieren
        update public.friendships
          set status = 'accepted',
              responded_at = now()
          where id = existing.id
          returning id, status into result_id, result_status;
        -- Mail an den urspruenglichen Requester
        perform public.queue_friend_accepted_mail(result_id);
        return query select result_id, result_status, 'auto_accept_reciprocal'::text;
        return;
      end if;
    elsif existing.status = 'declined' then
      -- War abgelehnt, jetzt neue Anfrage des selben oder anderen Senders
      update public.friendships
        set status = 'pending',
            requester_id = caller,
            created_at = now(),
            responded_at = null
        where id = existing.id
        returning id, status into result_id, result_status;
      perform public.queue_friend_request_mail(result_id);
      return query select result_id, result_status, 'reopened'::text;
      return;
    end if;
  end if;

  -- Neue Anfrage anlegen
  insert into public.friendships (user_low, user_high, requester_id, status)
    values (low_uid, high_uid, caller, 'pending')
    returning id, status into result_id, result_status;

  perform public.queue_friend_request_mail(result_id);

  return query select result_id, result_status, 'created'::text;
end;
$$;

revoke all on function public.friend_request_send(uuid) from public, anon;
grant execute on function public.friend_request_send(uuid) to authenticated;

----------------------------------------------------------------------
-- 4. friend_request_respond(request_id, accept) RPC
----------------------------------------------------------------------
create or replace function public.friend_request_respond(
  request_id uuid,
  accept     boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller     uuid := auth.uid();
  fr         record;
  new_status text;
begin
  if caller is null then
    raise exception 'Nicht authentifiziert' using errcode = '42501';
  end if;

  select * into fr from public.friendships where id = request_id;
  if fr.id is null then
    raise exception 'Anfrage nicht gefunden' using errcode = 'P0002';
  end if;

  -- Caller muss Teil der Beziehung sein, aber NICHT der Requester
  if caller <> fr.user_low and caller <> fr.user_high then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;
  if caller = fr.requester_id then
    raise exception 'Du kannst deine eigene Anfrage nicht beantworten'
      using errcode = '42501';
  end if;
  if fr.status <> 'pending' then
    raise exception 'Anfrage ist nicht mehr offen' using errcode = '22023';
  end if;

  new_status := case when accept then 'accepted' else 'declined' end;

  update public.friendships
    set status = new_status,
        responded_at = now()
    where id = request_id;

  if accept then
    perform public.queue_friend_accepted_mail(request_id);
  end if;
end;
$$;

revoke all on function public.friend_request_respond(uuid, boolean) from public, anon;
grant execute on function public.friend_request_respond(uuid, boolean) to authenticated;

----------------------------------------------------------------------
-- 5. friend_remove(other_user_id) RPC: Freundschaft loesen
----------------------------------------------------------------------
create or replace function public.friend_remove(other_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller   uuid := auth.uid();
  low_uid  uuid;
  high_uid uuid;
begin
  if caller is null then
    raise exception 'Nicht authentifiziert' using errcode = '42501';
  end if;

  low_uid  := least(caller, other_user_id);
  high_uid := greatest(caller, other_user_id);

  delete from public.friendships
    where user_low = low_uid and user_high = high_uid
      and (user_low = caller or user_high = caller);
end;
$$;

revoke all on function public.friend_remove(uuid) from public, anon;
grant execute on function public.friend_remove(uuid) to authenticated;

----------------------------------------------------------------------
-- 6. Mail-Queue-Helpers
----------------------------------------------------------------------
create or replace function public.queue_friend_request_mail(target_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fr           record;
  addressee_id uuid;
  to_email     text;
  to_name      text;
  from_name    text;
  from_handle  text;
begin
  select * into fr from public.friendships where id = target_request_id;
  if fr.id is null then return; end if;

  addressee_id := case
    when fr.requester_id = fr.user_low then fr.user_high
    else fr.user_low
  end;

  select u.email::text, p.display_name into to_email, to_name
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = addressee_id;

  select coalesce(p.display_name, p.handle, 'Ein Energizer'), p.handle into from_name, from_handle
    from public.profiles p where p.id = fr.requester_id;

  if to_email is null then return; end if;

  insert into public.outbound_emails (to_email, subject, body_text)
  values (
    to_email,
    'Energize · Neue Freundschaftsanfrage von ' || from_name,
    'Hi ' || coalesce(to_name, 'Energizer') || ',' || E'\n\n' ||
    from_name || coalesce(' (@' || from_handle || ')', '') || ' moechte mit dir auf Energize befreundet sein.' || E'\n\n' ||
    'Du kannst die Anfrage in deinem Account annehmen oder ablehnen:' || E'\n' ||
    'https://energize.blackout42.de/account/' || E'\n\n' ||
    'Energize Crew'
  );
end;
$$;

revoke all on function public.queue_friend_request_mail(uuid) from public, anon;

create or replace function public.queue_friend_accepted_mail(target_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fr           record;
  requester_id uuid;
  to_email     text;
  to_name      text;
  partner_name text;
begin
  select * into fr from public.friendships where id = target_request_id;
  if fr.id is null then return; end if;

  requester_id := fr.requester_id;

  select u.email::text, p.display_name into to_email, to_name
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.id = requester_id;

  -- Partner ist der andere im Paar
  select coalesce(p.display_name, p.handle, 'Energizer') into partner_name
    from public.profiles p
    where p.id = case
      when requester_id = fr.user_low then fr.user_high
      else fr.user_low
    end;

  if to_email is null then return; end if;

  insert into public.outbound_emails (to_email, subject, body_text)
  values (
    to_email,
    'Energize · ' || partner_name || ' hat eure Freundschaft bestaetigt',
    'Hi ' || coalesce(to_name, 'Energizer') || ',' || E'\n\n' ||
    partner_name || ' hat deine Freundschaftsanfrage angenommen. Ihr seid jetzt auf Energize verbunden.' || E'\n\n' ||
    'Energize Crew'
  );
end;
$$;

revoke all on function public.queue_friend_accepted_mail(uuid) from public, anon;

----------------------------------------------------------------------
-- 7. friends_my_list(): Liste aller akzeptierten Freunde des Callers
----------------------------------------------------------------------
create or replace function public.friends_my_list()
returns table (
  friendship_id  uuid,
  friend_id      uuid,
  display_name   text,
  handle         text,
  avatar_path    text,
  since          timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    f.id,
    case when f.user_low = auth.uid() then f.user_high else f.user_low end as friend_id,
    p.display_name,
    p.handle,
    p.avatar_path,
    f.responded_at as since
  from public.friendships f
  join public.profiles p on p.id = case
    when f.user_low = auth.uid() then f.user_high
    else f.user_low
  end
  where (f.user_low = auth.uid() or f.user_high = auth.uid())
    and f.status = 'accepted'
  order by f.responded_at desc;
$$;

revoke all on function public.friends_my_list() from public, anon;
grant execute on function public.friends_my_list() to authenticated;

----------------------------------------------------------------------
-- 8. friends_my_pending(): Anfragen, die der Caller noch beantworten muss
----------------------------------------------------------------------
create or replace function public.friends_my_pending()
returns table (
  friendship_id  uuid,
  requester_id   uuid,
  display_name   text,
  handle         text,
  avatar_path    text,
  requested_at   timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    f.id,
    f.requester_id,
    p.display_name,
    p.handle,
    p.avatar_path,
    f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.requester_id
  where (f.user_low = auth.uid() or f.user_high = auth.uid())
    and f.requester_id <> auth.uid()
    and f.status = 'pending'
  order by f.created_at desc;
$$;

revoke all on function public.friends_my_pending() from public, anon;
grant execute on function public.friends_my_pending() to authenticated;

----------------------------------------------------------------------
-- 9. friend_status_with(other_user_id): Status der Beziehung Caller
--    <-> Other, fuer Profil-Seiten "Anfrage senden" vs. "schon Freunde"
----------------------------------------------------------------------
create or replace function public.friend_status_with(other_user_id uuid)
returns table (
  status         text,
  is_my_request  boolean,
  friendship_id  uuid
)
language sql
security definer
stable
set search_path = public
as $$
  select
    f.status,
    f.requester_id = auth.uid() as is_my_request,
    f.id
  from public.friendships f
  where f.user_low = least(auth.uid(), other_user_id)
    and f.user_high = greatest(auth.uid(), other_user_id)
    and (f.user_low = auth.uid() or f.user_high = auth.uid());
$$;

revoke all on function public.friend_status_with(uuid) from public, anon;
grant execute on function public.friend_status_with(uuid) to authenticated;
