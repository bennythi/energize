-- Energize Festival — Crew-Rolle vom Admin-Rolle entkoppeln
-- Stand: 2026-06-15
--
-- Vorher: profiles.role = 'user' | 'admin' | 'crew'. Heisst Admin und Crew
-- haben sich gegenseitig ausgeschlossen.
-- Neu: profiles.role bleibt 'user' | 'admin', dazu unabhaengiges Flag
-- profiles.is_crew BOOLEAN. Heisst:
--   - User                  → role='user',  is_crew=false
--   - User + Crew           → role='user',  is_crew=true
--   - Admin                 → role='admin', is_crew=false (Admin zaehlt
--                             trotzdem als Crew via is_crew()-Helper)
--   - Admin + Crew explizit → role='admin', is_crew=true
--
-- Setzt voraus, dass 0013_crew.sql gelaufen ist.

----------------------------------------------------------------------
-- 1. Neue Spalte is_crew + crew_roles (idempotent, falls 0013 nicht lief)
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_crew boolean not null default false;

alter table public.profiles
  add column if not exists crew_roles text[] not null default '{}';

----------------------------------------------------------------------
-- 2. Migrate alte role='crew'-Datensaetze auf is_crew=true + role='user'
--    Falls 0013 nicht lief, ist das ein NOOP.
----------------------------------------------------------------------
update public.profiles
   set is_crew = true,
       role    = 'user'
 where role = 'crew';

----------------------------------------------------------------------
-- 3. role-CHECK-Constraint zurueck auf nur 'user' | 'admin'
----------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin'));

----------------------------------------------------------------------
-- 4. is_crew() aktualisieren: User ist Crew, wenn is_crew=true ODER admin
----------------------------------------------------------------------
create or replace function public.is_crew()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (is_crew = true or role = 'admin')
  );
$$;

revoke all on function public.is_crew() from public, anon;
grant execute on function public.is_crew() to authenticated;

----------------------------------------------------------------------
-- 5. admin_set_role wieder strikt auf 'user' | 'admin'
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

----------------------------------------------------------------------
-- 6. admin_set_crew_role: aendert NUR is_crew + crew_roles, role bleibt
----------------------------------------------------------------------
create or replace function public.admin_set_crew_role(
  target_user_id uuid,
  make_crew      boolean,
  roles          text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  update public.profiles
     set is_crew    = make_crew,
         crew_roles = case when make_crew then roles else '{}' end
   where id = target_user_id;

  if not found then
    raise exception 'User nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_crew_role(uuid, boolean, text[]) from public, anon;
grant execute on function public.admin_set_crew_role(uuid, boolean, text[]) to authenticated;

----------------------------------------------------------------------
-- 7. admin_list_crew: alle Admins + alle is_crew=true
----------------------------------------------------------------------
drop function if exists public.admin_list_crew();
create or replace function public.admin_list_crew()
returns table (
  id            uuid,
  email         text,
  display_name  text,
  handle        text,
  role          text,
  is_crew       boolean,
  crew_roles    text[],
  avatar_path   text,
  created_at    timestamptz
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
    p.is_crew,
    p.crew_roles,
    p.avatar_path,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
    and (p.is_crew = true or p.role = 'admin')
  order by (p.role = 'admin') desc, p.is_crew desc, p.display_name nulls last;
$$;

revoke all on function public.admin_list_crew() from public, anon;
grant execute on function public.admin_list_crew() to authenticated;

----------------------------------------------------------------------
-- 8. crew_list_members
----------------------------------------------------------------------
drop function if exists public.crew_list_members();
create or replace function public.crew_list_members()
returns table (
  id            uuid,
  display_name  text,
  handle        text,
  role          text,
  is_crew       boolean,
  crew_roles    text[],
  avatar_path   text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.handle,
    p.role,
    p.is_crew,
    p.crew_roles,
    p.avatar_path
  from public.profiles p
  where public.is_crew()
    and (p.is_crew = true or p.role = 'admin')
  order by (p.role = 'admin') desc, p.is_crew desc, p.display_name nulls last;
$$;

revoke all on function public.crew_list_members() from public, anon;
grant execute on function public.crew_list_members() to authenticated;

----------------------------------------------------------------------
-- 9. profiles_public View um is_crew erweitern
----------------------------------------------------------------------
drop view if exists public.profiles_public;
create or replace view public.profiles_public
with (security_invoker = false) as
  select
    id,
    display_name,
    handle,
    country,
    role,
    is_crew,
    festivals_attended,
    avatar_path,
    created_at
  from public.profiles;

grant select on public.profiles_public to anon, authenticated;
