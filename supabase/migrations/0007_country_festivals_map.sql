-- Energize Festival — Land + Festival-Count + anonyme Karten-RPC
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- 1. profiles um country und festivals_attended erweitern
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists country            text default 'DE' not null,
  add column if not exists festivals_attended smallint default 0 not null;

alter table public.profiles
  drop constraint if exists profiles_country_check;
alter table public.profiles
  add constraint profiles_country_check
  check (country ~ '^[A-Z]{2}$');

alter table public.profiles
  drop constraint if exists profiles_festivals_attended_check;
alter table public.profiles
  add constraint profiles_festivals_attended_check
  check (festivals_attended between 0 and 6);

----------------------------------------------------------------------
-- 2. community_locations() — anonyme Aggregate fuer die Karte.
--    Gibt NUR Region + Count zurueck, keine User-IDs.
--    Public callable (auch fuer anon User), weil das Daten-Aggregat
--    nicht sensitiv ist.
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
  having count(*) > 0;
$$;

revoke all on function public.community_locations() from public;
grant execute on function public.community_locations() to anon, authenticated;

-- admin_list_users() um neue Felder erweitern (drop und neu, damit
-- die Return-Signatur passt)
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id                  uuid,
  email               text,
  display_name        text,
  handle              text,
  role                text,
  phone               text,
  birthdate           date,
  postal_code         text,
  country             text,
  festivals_attended  smallint,
  created_at          timestamptz,
  email_confirmed_at  timestamptz,
  last_sign_in_at     timestamptz
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
