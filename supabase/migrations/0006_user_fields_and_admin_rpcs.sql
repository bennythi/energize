-- Energize Festival — User-Felder + Admin-RPCs
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- 1. profiles um freiwillige User-Felder erweitern
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone        text,
  add column if not exists birthdate    date,
  add column if not exists postal_code  text;

-- Soft-Constraint: Plausibilitaet, nicht Format-Pflicht
alter table public.profiles
  drop constraint if exists profiles_postal_code_check;
alter table public.profiles
  add constraint profiles_postal_code_check
  check (postal_code is null or length(postal_code) between 3 and 12);

alter table public.profiles
  drop constraint if exists profiles_phone_check;
alter table public.profiles
  add constraint profiles_phone_check
  check (phone is null or length(phone) between 5 and 25);

alter table public.profiles
  drop constraint if exists profiles_birthdate_check;
alter table public.profiles
  add constraint profiles_birthdate_check
  check (birthdate is null or birthdate < current_date);

----------------------------------------------------------------------
-- 2. admin_list_users() — Admins koennen alle User incl. E-Mail aus
--    auth.users sehen (normal nicht zugänglich für anon).
--    security definer = laeuft mit owner-Rechten, but is_admin()-
--    Check stellt sicher dass nur Admins das aufrufen koennen.
----------------------------------------------------------------------
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
    p.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc
  limit 500;
$$;

-- Admins koennen den RPC ausfuehren, anon NICHT
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

----------------------------------------------------------------------
-- 3. admin_set_role() — Admins koennen Rolle setzen.
--    Founder-Lock: benjamin.thiel@outlook.com kann nicht entzogen
--    werden (egal von wem).
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

  -- Founder-Lock: dem darf niemand die Admin-Rolle nehmen
  if target_email = 'benjamin.thiel@outlook.com' and new_role <> 'admin' then
    raise exception 'Founder-Account kann nicht entzogen werden'
      using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
