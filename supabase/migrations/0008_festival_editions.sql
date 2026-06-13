-- Energize Festival — Edition-Multi-Select statt Counter
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- 1. Neues Feld: festivals_attended_editions als text[]
--    Erlaubte Werte: '2020' .. '2026' (alle vergangenen Editionen)
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists festivals_attended_editions text[] default '{}'::text[] not null;

-- Constraint: nur gueltige Edition-Strings
alter table public.profiles
  drop constraint if exists profiles_editions_check;
alter table public.profiles
  add constraint profiles_editions_check
  check (
    festivals_attended_editions <@ array['2020','2021','2022','2023','2024','2025','2026']::text[]
  );

----------------------------------------------------------------------
-- 2. Alte festivals_attended (smallint) ist nicht mehr noetig — wir
--    lassen sie als kompatibel, aber die App nutzt nur noch das array.
--    (Datenmigration: wenn jemand 3 festivals_attended hatte, ist
--    das nicht 1:1 auf Editionen mappbar — User muss neu auswaehlen.)
----------------------------------------------------------------------

----------------------------------------------------------------------
-- 3. admin_list_users() um neue Spalte erweitern
----------------------------------------------------------------------
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id                          uuid,
  email                       text,
  display_name                text,
  handle                      text,
  role                        text,
  phone                       text,
  birthdate                   date,
  postal_code                 text,
  country                     text,
  festivals_attended          smallint,
  festivals_attended_editions text[],
  created_at                  timestamptz,
  email_confirmed_at          timestamptz,
  last_sign_in_at             timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.display_name,
    p.handle,
    p.role,
    p.phone,
    p.birthdate,
    p.postal_code,
    p.country,
    p.festivals_attended,
    p.festivals_attended_editions,
    p.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc
  limit 500;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
