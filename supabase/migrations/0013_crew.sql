-- Energize Festival — Crew-Bereich
-- Stand: 2026-06-15
--
-- Eigene Rolle 'crew' (zusaetzlich zu 'user' und 'admin').
-- crew_roles TEXT[] fuer spaeter feinere Crew-Rollen (Technik,
-- Kommunikation, Infrastruktur, ...).
--
-- Zwei Crew-Tools in dieser Migration:
--   1) crew_availability  — wann ist wer da
--   2) crew_equipment_requests — wer braucht welches Funk-Headset

----------------------------------------------------------------------
-- 1. profiles.role um 'crew' erweitern + crew_roles[] Spalte
----------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'crew'));

alter table public.profiles
  add column if not exists crew_roles text[] not null default '{}';

----------------------------------------------------------------------
-- 2. is_crew() — analog zu is_admin().
--    Admin zaehlt automatisch auch als Crew (Admins koennen die
--    Crew-Tools nutzen, ohne sich selbst die Rolle zuweisen zu muessen).
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
      and role in ('crew', 'admin')
  );
$$;

revoke all on function public.is_crew() from public, anon;
grant execute on function public.is_crew() to authenticated;

----------------------------------------------------------------------
-- 3. crew_availability
----------------------------------------------------------------------
create table if not exists public.crew_availability (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  kind        text not null check (kind in ('all_day', 'window')),
  note        text check (note is null or length(note) <= 200),
  created_at  timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists crew_availability_user_idx
  on public.crew_availability (user_id, start_at);
create index if not exists crew_availability_range_idx
  on public.crew_availability (start_at, end_at);

alter table public.crew_availability enable row level security;

drop policy if exists "crew_availability_select" on public.crew_availability;
create policy "crew_availability_select"
  on public.crew_availability for select
  using (public.is_crew());

drop policy if exists "crew_availability_insert_own" on public.crew_availability;
create policy "crew_availability_insert_own"
  on public.crew_availability for insert
  with check (
    public.is_crew()
    and auth.uid() = user_id
  );

drop policy if exists "crew_availability_update_own" on public.crew_availability;
create policy "crew_availability_update_own"
  on public.crew_availability for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "crew_availability_delete_own" on public.crew_availability;
create policy "crew_availability_delete_own"
  on public.crew_availability for delete
  using (auth.uid() = user_id);

----------------------------------------------------------------------
-- 4. crew_equipment_requests
--    Ein Eintrag = "ich brauche an Tag X Equipment Y".
--    Unique-Constraint: pro (user, day) nur ein Eintrag.
----------------------------------------------------------------------
create table if not exists public.crew_equipment_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_day   date not null,
  equipment   text not null check (equipment in ('razor', 'headphones', 'inear')),
  note        text check (note is null or length(note) <= 200),
  created_at  timestamptz not null default now(),
  unique (user_id, event_day)
);

create index if not exists crew_equipment_day_idx
  on public.crew_equipment_requests (event_day, equipment);

alter table public.crew_equipment_requests enable row level security;

drop policy if exists "crew_equipment_select" on public.crew_equipment_requests;
create policy "crew_equipment_select"
  on public.crew_equipment_requests for select
  using (public.is_crew());

drop policy if exists "crew_equipment_insert_own" on public.crew_equipment_requests;
create policy "crew_equipment_insert_own"
  on public.crew_equipment_requests for insert
  with check (
    public.is_crew()
    and auth.uid() = user_id
  );

drop policy if exists "crew_equipment_update_own" on public.crew_equipment_requests;
create policy "crew_equipment_update_own"
  on public.crew_equipment_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "crew_equipment_delete_own" on public.crew_equipment_requests;
create policy "crew_equipment_delete_own"
  on public.crew_equipment_requests for delete
  using (auth.uid() = user_id);

----------------------------------------------------------------------
-- 5. admin_set_crew_role() — Admin vergibt/entzieht Crew-Rolle
--    Founder-Lock: kann nicht entzogen werden.
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
declare
  target_email   text;
  current_role   text;
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  select email::text into target_email
    from auth.users where id = target_user_id;
  if target_email is null then
    raise exception 'User nicht gefunden' using errcode = 'P0002';
  end if;

  -- Founder bleibt Admin
  if lower(target_email) = 'benjamin.thiel@outlook.com' then
    update public.profiles
       set crew_roles = roles
     where id = target_user_id;
    return;
  end if;

  select role into current_role
    from public.profiles where id = target_user_id;

  -- Admin-Rolle nicht ueberschreiben durch Crew-Toggle
  if current_role = 'admin' then
    update public.profiles
       set crew_roles = roles
     where id = target_user_id;
    return;
  end if;

  update public.profiles
     set role       = case when make_crew then 'crew' else 'user' end,
         crew_roles = case when make_crew then roles else '{}' end
   where id = target_user_id;
end;
$$;

revoke all on function public.admin_set_crew_role(uuid, boolean, text[]) from public, anon;
grant execute on function public.admin_set_crew_role(uuid, boolean, text[]) to authenticated;

----------------------------------------------------------------------
-- 6. admin_list_crew() — Liste aller Crew-Mitglieder incl. Mail
----------------------------------------------------------------------
create or replace function public.admin_list_crew()
returns table (
  id            uuid,
  email         text,
  display_name  text,
  handle        text,
  role          text,
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
    p.crew_roles,
    p.avatar_path,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
    and p.role in ('crew', 'admin')
  order by p.role desc, p.display_name nulls last;
$$;

revoke all on function public.admin_list_crew() from public, anon;
grant execute on function public.admin_list_crew() to authenticated;

----------------------------------------------------------------------
-- 7. crew_list_members() — Crew sieht andere Crew-Mitglieder
--    (display_name + handle + avatar, ohne Email/PII)
----------------------------------------------------------------------
create or replace function public.crew_list_members()
returns table (
  id            uuid,
  display_name  text,
  handle        text,
  role          text,
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
    p.crew_roles,
    p.avatar_path
  from public.profiles p
  where public.is_crew()
    and p.role in ('crew', 'admin')
  order by p.role desc, p.display_name nulls last;
$$;

revoke all on function public.crew_list_members() from public, anon;
grant execute on function public.crew_list_members() to authenticated;
