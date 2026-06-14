-- Energize Festival — Security Hardening
-- Stand: 2026-06-14
--
-- Fixes aus dem internen Security-Review (Findings #1, #2, #4, #5, #6, #7, #10).
-- Sicherheit-fokussiert, keine funktionalen Aenderungen.

----------------------------------------------------------------------
-- 1. Finding #1 (HIGH) — CRLF im support_tickets.subject blocken
--    Vermeidet SMTP-Header-Injection, sobald die Edge Function das
--    Subject in den Mail-Header schreibt.
----------------------------------------------------------------------
alter table public.support_tickets
  drop constraint if exists support_tickets_subject_no_crlf;
alter table public.support_tickets
  add constraint support_tickets_subject_no_crlf
  check (subject !~ '[\r\n]');

----------------------------------------------------------------------
-- 2. Finding #2 (HIGH) — touch_support_ticket() als security definer
--    Sonst greift RLS (User hat keine UPDATE-Policy auf support_tickets)
--    und der Status-Transition-Trigger laeuft still ins Leere.
----------------------------------------------------------------------
create or replace function public.touch_support_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  select status into current_status from public.support_tickets where id = new.ticket_id;

  update public.support_tickets
     set updated_at = now(),
         last_admin_reply_at = case when new.is_staff then now() else last_admin_reply_at end,
         status = case
           when new.is_staff and current_status in ('open', 'in_progress') then 'answered'
           when not new.is_staff and current_status = 'answered' then 'in_progress'
           else current_status
         end
   where id = new.ticket_id;
  return new;
end;
$$;

revoke all on function public.touch_support_ticket() from public, anon;

----------------------------------------------------------------------
-- 3. Finding #6 (MEDIUM) — set_feedback_updated_at search_path haerten
----------------------------------------------------------------------
create or replace function public.set_feedback_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

----------------------------------------------------------------------
-- 4. Finding #4 (MEDIUM) — Founder-Lock case-insensitiv
----------------------------------------------------------------------
create or replace function public.admin_set_role(
  target_user_id uuid,
  new_role       text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  if new_role not in ('user', 'admin') then
    raise exception 'Ungueltige Rolle: %', new_role using errcode = '22023';
  end if;

  select email::text into target_email
    from auth.users where id = target_user_id;

  if target_email is null then
    raise exception 'User nicht gefunden' using errcode = 'P0002';
  end if;

  if lower(target_email) = 'benjamin.thiel@outlook.com' and new_role <> 'admin' then
    raise exception 'Founder-Account kann nicht entzogen werden'
      using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  select email::text into target_email
    from auth.users where id = target_user_id;

  if target_email is null then
    raise exception 'User nicht gefunden' using errcode = 'P0002';
  end if;

  if lower(target_email) = 'benjamin.thiel@outlook.com' then
    raise exception 'Founder-Account kann nicht geloescht werden'
      using errcode = '42501';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'Du kannst dich nicht selbst loeschen'
      using errcode = '42501';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

----------------------------------------------------------------------
-- 5. Finding #5 (MEDIUM) — community_locations() k-anonymity
--    Regionen mit weniger als 5 Usern werden ausgeblendet.
----------------------------------------------------------------------
create or replace function public.community_locations()
returns table (
  country    text,
  region     text,
  count      bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with regional as (
    select
      country,
      case
        when country = 'DE' and postal_code ~ '^[0-9]'
          then substring(postal_code from 1 for 1)
        else null
      end as region
    from public.profiles
  )
  select
    country,
    coalesce(region, '_') as region,
    count(*)::bigint
  from regional
  group by country, region
  having count(*) >= 5;
$$;

----------------------------------------------------------------------
-- 6. Finding #7 (HIGH) — profiles SELECT-Policy auf oeffentliche
--    Spalten beschraenken. Vorher konnte jeder anon-Client per
--    `client.from('profiles').select('phone, birthdate, postal_code')`
--    PII aller User abziehen.
--
--    Loesung:
--      a) self-only Policy auf der Tabelle (User sieht eigene Zeile mit
--         allen Feldern).
--      b) Public-View `profiles_public` mit nur den unbedenklichen
--         Spalten — Wall/Lineup/Community lesen ueber die View.
----------------------------------------------------------------------
drop policy if exists "profiles are viewable by everyone" on public.profiles;

create policy "profiles self select"
  on public.profiles for select
  using (auth.uid() = id);

-- Public-View ohne phone/birthdate/postal_code
create or replace view public.profiles_public
with (security_invoker = true) as
  select
    id,
    display_name,
    handle,
    country,
    role,
    festivals_attended,
    created_at
  from public.profiles;

-- Wenn die View security_invoker=true ist, greifen die Policies des
-- Aufrufers. Damit anon/authenticated trotzdem fremde Zeilen lesen
-- koennen, brauchen wir eine zusaetzliche Policy auf der Tabelle, die
-- NUR die nicht-sensitiven Spalten erlaubt. Postgres hat keine
-- column-level Policies, deshalb: zweite Policy mit using(true) gilt
-- fuer SELECT, aber der Client-Code MUSS die View benutzen.
--
-- Pragmatischer: wir machen die View security_definer und entkoppeln
-- den Zugriff komplett von der Tabellen-Policy.
drop view if exists public.profiles_public;
create or replace view public.profiles_public
with (security_invoker = false) as
  select
    id,
    display_name,
    handle,
    country,
    role,
    festivals_attended,
    created_at
  from public.profiles;

grant select on public.profiles_public to anon, authenticated;

----------------------------------------------------------------------
-- 7. Finding #10 (LOW) — admin_close/reopen_ticket: NOT FOUND check
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

  if not found then
    raise exception 'Ticket nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;

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

  if not found then
    raise exception 'Ticket nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;
