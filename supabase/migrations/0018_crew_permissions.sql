-- Energize Festival — Granulare Crew-Permissions
-- Stand: 2026-06-16
--
-- Drei-Ebenen-System:
--   1. Admin: hat IMMER delete-Level auf alles, kein Eintrag noetig.
--   2. Rollen-basiert (profiles.crew_roles enthaelt z.B. 'einlass'):
--      jede Rolle bekommt pro Resource ein Level zugewiesen.
--   3. Einzelperson-Override (crew_user_permissions): hat Vorrang vor
--      Rollen, wenn gesetzt. Bei mehreren wird das HOECHSTE Level genommen.
--
-- Levels (hierarchisch):
--   'read'   = darf sehen
--   'write'  = darf sehen + bearbeiten
--   'delete' = darf sehen + bearbeiten + loeschen
--
-- Default fuer Crew ohne explizite Permissions: KEIN Zugriff (User sieht
-- nur das /crew-Dashboard mit dem Hinweis, dass der Admin noch Rollen
-- zuweisen muss).

----------------------------------------------------------------------
-- 1. crew_resources: feste Liste der berechtigbaren Funktionen
----------------------------------------------------------------------
create table if not exists public.crew_resources (
  slug         text primary key check (slug ~ '^[a-z0-9._-]+$' and length(slug) between 2 and 80),
  label        text not null,
  description  text,
  sort_order   integer not null default 100
);

-- Initial-Seed
insert into public.crew_resources (slug, label, description, sort_order) values
  ('crew.kalender',     'Crew-Kalender',     'Verfuegbarkeiten der Crew pro Tag und Zeitfenster', 10),
  ('crew.fungeraete',   'Funkgeraete',       'Tagesbedarf und Bestellempfehlung', 20),
  ('crew.kasse',        'Cashless-Kassen',   'Top-Up-Kassen-Abrechnung mit Schichten', 30),
  ('crew.briefings',    'Briefings',         'Briefing-Dokumente nach Abteilung', 40),
  ('crew.meilensteine', 'Meilensteine',      'Jahres-Deadlines und Bestellungen', 50)
on conflict (slug) do update
  set label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;

----------------------------------------------------------------------
-- 2. crew_role_permissions
----------------------------------------------------------------------
create table if not exists public.crew_role_permissions (
  id              uuid primary key default gen_random_uuid(),
  role            text not null check (length(role) between 2 and 80),
  resource_slug   text not null references public.crew_resources(slug) on delete cascade,
  level           text not null check (level in ('read', 'write', 'delete')),
  created_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id) on delete set null,
  unique (role, resource_slug)
);

create index if not exists crew_role_perms_resource_idx
  on public.crew_role_permissions (resource_slug);

----------------------------------------------------------------------
-- 3. crew_user_permissions (Einzelperson-Override)
----------------------------------------------------------------------
create table if not exists public.crew_user_permissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  resource_slug   text not null references public.crew_resources(slug) on delete cascade,
  level           text not null check (level in ('read', 'write', 'delete')),
  created_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id) on delete set null,
  unique (user_id, resource_slug)
);

create index if not exists crew_user_perms_user_idx
  on public.crew_user_permissions (user_id);

----------------------------------------------------------------------
-- 4. RLS
----------------------------------------------------------------------
alter table public.crew_resources enable row level security;
alter table public.crew_role_permissions enable row level security;
alter table public.crew_user_permissions enable row level security;

-- resources: alle Crew lesen, Admin verwaltet (per RPC)
drop policy if exists "crew_resources_select" on public.crew_resources;
create policy "crew_resources_select"
  on public.crew_resources for select
  using (public.is_crew());

-- role-permissions: alle Crew lesen, Admin schreibt per RPC
drop policy if exists "crew_role_perms_select" on public.crew_role_permissions;
create policy "crew_role_perms_select"
  on public.crew_role_permissions for select
  using (public.is_crew());

-- user-permissions: Admin sieht alles, User sieht eigene
drop policy if exists "crew_user_perms_select" on public.crew_user_permissions;
create policy "crew_user_perms_select"
  on public.crew_user_permissions for select
  using (public.is_admin() or auth.uid() = user_id);

----------------------------------------------------------------------
-- 5. crew_can(resource, required_level): zentrale Check-Funktion
----------------------------------------------------------------------
create or replace function public.crew_can(resource text, required_level text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  with my_profile as (
    select role, crew_roles from public.profiles where id = auth.uid()
  ),
  effective as (
    -- Admin = delete level
    select 3 as lvl from my_profile where role = 'admin'
    union all
    -- User-Override
    select case level when 'delete' then 3 when 'write' then 2 else 1 end
      from public.crew_user_permissions
      where user_id = auth.uid() and resource_slug = resource
    union all
    -- Rollen-Permissions
    select case rp.level when 'delete' then 3 when 'write' then 2 else 1 end
      from public.crew_role_permissions rp, my_profile mp
      where rp.resource_slug = resource
        and rp.role = any(mp.crew_roles)
  )
  select coalesce(max(lvl), 0) >= case required_level when 'delete' then 3 when 'write' then 2 else 1 end
    from effective;
$$;

revoke all on function public.crew_can(text, text) from public, anon;
grant execute on function public.crew_can(text, text) to authenticated;

----------------------------------------------------------------------
-- 6. crew_my_permissions(): Liste aller Permissions des aktuellen Users
--    fuer Client-seitige UI-Logik (Tiles ein/aus, Bearbeiten-Buttons).
--    Admin bekommt synthetische delete-Eintraege fuer alle Resources.
----------------------------------------------------------------------
create or replace function public.crew_my_permissions()
returns table (
  resource_slug  text,
  level          text
)
language sql
security definer
stable
set search_path = public
as $$
  with my_profile as (
    select role, crew_roles from public.profiles where id = auth.uid()
  )
  select r.slug,
    case max(
      case lvl
        when 'delete' then 3
        when 'write' then 2
        else 1
      end
    )
    when 3 then 'delete'
    when 2 then 'write'
    else 'read'
    end
  from public.crew_resources r
  left join lateral (
    -- Admin: synthetischer delete-Eintrag
    select 'delete'::text as lvl from my_profile where role = 'admin'
    union all
    -- User-Override
    select level::text from public.crew_user_permissions
      where user_id = auth.uid() and resource_slug = r.slug
    union all
    -- Rollen-Permissions
    select rp.level::text from public.crew_role_permissions rp, my_profile mp
      where rp.resource_slug = r.slug and rp.role = any(mp.crew_roles)
  ) sub on true
  where sub.lvl is not null
  group by r.slug;
$$;

revoke all on function public.crew_my_permissions() from public, anon;
grant execute on function public.crew_my_permissions() to authenticated;

----------------------------------------------------------------------
-- 7. admin_set_role_permission
----------------------------------------------------------------------
create or replace function public.admin_set_role_permission(
  role           text,
  resource_slug  text,
  new_level      text
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

  if new_level is null then
    delete from public.crew_role_permissions
      where crew_role_permissions.role = admin_set_role_permission.role
        and crew_role_permissions.resource_slug = admin_set_role_permission.resource_slug;
  else
    if new_level not in ('read', 'write', 'delete') then
      raise exception 'Ungueltiges Level: %', new_level using errcode = '22023';
    end if;
    insert into public.crew_role_permissions (role, resource_slug, level, created_by)
      values (admin_set_role_permission.role, admin_set_role_permission.resource_slug, new_level, auth.uid())
    on conflict (role, resource_slug) do update
      set level = excluded.level,
          created_at = now(),
          created_by = excluded.created_by;
  end if;
end;
$$;

revoke all on function public.admin_set_role_permission(text, text, text) from public, anon;
grant execute on function public.admin_set_role_permission(text, text, text) to authenticated;

----------------------------------------------------------------------
-- 8. admin_set_user_permission
----------------------------------------------------------------------
create or replace function public.admin_set_user_permission(
  target_user_id  uuid,
  resource_slug   text,
  new_level       text
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

  if new_level is null then
    delete from public.crew_user_permissions
      where crew_user_permissions.user_id = target_user_id
        and crew_user_permissions.resource_slug = admin_set_user_permission.resource_slug;
  else
    if new_level not in ('read', 'write', 'delete') then
      raise exception 'Ungueltiges Level: %', new_level using errcode = '22023';
    end if;
    insert into public.crew_user_permissions (user_id, resource_slug, level, created_by)
      values (target_user_id, admin_set_user_permission.resource_slug, new_level, auth.uid())
    on conflict (user_id, resource_slug) do update
      set level = excluded.level,
          created_at = now(),
          created_by = excluded.created_by;
  end if;
end;
$$;

revoke all on function public.admin_set_user_permission(uuid, text, text) from public, anon;
grant execute on function public.admin_set_user_permission(uuid, text, text) to authenticated;

----------------------------------------------------------------------
-- 9. Bestehende RLS-Policies der Crew-Tabellen auf crew_can() umstellen
----------------------------------------------------------------------

-- crew_availability: read/write/delete via crew.kalender
drop policy if exists "crew_availability_select" on public.crew_availability;
create policy "crew_availability_select"
  on public.crew_availability for select
  using (public.crew_can('crew.kalender', 'read'));

drop policy if exists "crew_availability_insert_own" on public.crew_availability;
create policy "crew_availability_insert_own"
  on public.crew_availability for insert
  with check (
    public.crew_can('crew.kalender', 'write')
    and auth.uid() = user_id
  );

drop policy if exists "crew_availability_update_own" on public.crew_availability;
create policy "crew_availability_update_own"
  on public.crew_availability for update
  using (public.crew_can('crew.kalender', 'write') and auth.uid() = user_id)
  with check (public.crew_can('crew.kalender', 'write') and auth.uid() = user_id);

drop policy if exists "crew_availability_delete_own" on public.crew_availability;
create policy "crew_availability_delete_own"
  on public.crew_availability for delete
  using (
    (public.crew_can('crew.kalender', 'write') and auth.uid() = user_id)
    or public.crew_can('crew.kalender', 'delete')
  );

-- crew_equipment_requests: read/write/delete via crew.fungeraete
drop policy if exists "crew_equipment_select" on public.crew_equipment_requests;
create policy "crew_equipment_select"
  on public.crew_equipment_requests for select
  using (public.crew_can('crew.fungeraete', 'read'));

drop policy if exists "crew_equipment_insert_own" on public.crew_equipment_requests;
create policy "crew_equipment_insert_own"
  on public.crew_equipment_requests for insert
  with check (
    public.crew_can('crew.fungeraete', 'write')
    and auth.uid() = user_id
  );

drop policy if exists "crew_equipment_update_own" on public.crew_equipment_requests;
create policy "crew_equipment_update_own"
  on public.crew_equipment_requests for update
  using (public.crew_can('crew.fungeraete', 'write') and auth.uid() = user_id)
  with check (public.crew_can('crew.fungeraete', 'write') and auth.uid() = user_id);

drop policy if exists "crew_equipment_delete_own" on public.crew_equipment_requests;
create policy "crew_equipment_delete_own"
  on public.crew_equipment_requests for delete
  using (
    (public.crew_can('crew.fungeraete', 'write') and auth.uid() = user_id)
    or public.crew_can('crew.fungeraete', 'delete')
  );

-- cashless_*: read/write via crew.kasse
drop policy if exists "cashless_registers_select" on public.cashless_registers;
create policy "cashless_registers_select"
  on public.cashless_registers for select
  using (public.crew_can('crew.kasse', 'read'));

drop policy if exists "cashless_shifts_select" on public.cashless_shifts;
create policy "cashless_shifts_select"
  on public.cashless_shifts for select
  using (public.crew_can('crew.kasse', 'read'));

drop policy if exists "cashless_shifts_insert" on public.cashless_shifts;
create policy "cashless_shifts_insert"
  on public.cashless_shifts for insert
  with check (
    public.crew_can('crew.kasse', 'write')
    and (auth.uid() = opened_by_a or auth.uid() = opened_by_b)
  );

drop policy if exists "cashless_shifts_update" on public.cashless_shifts;
create policy "cashless_shifts_update"
  on public.cashless_shifts for update
  using (public.crew_can('crew.kasse', 'write'))
  with check (public.crew_can('crew.kasse', 'write'));

drop policy if exists "cashless_denoms_select" on public.cashless_shift_denominations;
create policy "cashless_denoms_select"
  on public.cashless_shift_denominations for select
  using (public.crew_can('crew.kasse', 'read'));

drop policy if exists "cashless_denoms_insert" on public.cashless_shift_denominations;
create policy "cashless_denoms_insert"
  on public.cashless_shift_denominations for insert
  with check (
    public.crew_can('crew.kasse', 'write')
    and exists (
      select 1 from public.cashless_shifts s
        where s.id = shift_id
          and (kind = 'end' or s.closed_at is null)
    )
  );

drop policy if exists "cashless_denoms_update" on public.cashless_shift_denominations;
create policy "cashless_denoms_update"
  on public.cashless_shift_denominations for update
  using (
    public.crew_can('crew.kasse', 'write')
    and exists (
      select 1 from public.cashless_shifts s where s.id = shift_id and s.closed_at is null
    )
  );

drop policy if exists "cashless_movements_select" on public.cashless_movements;
create policy "cashless_movements_select"
  on public.cashless_movements for select
  using (public.crew_can('crew.kasse', 'read'));

drop policy if exists "cashless_movements_insert" on public.cashless_movements;
create policy "cashless_movements_insert"
  on public.cashless_movements for insert
  with check (
    public.crew_can('crew.kasse', 'write')
    and exists (
      select 1 from public.cashless_shifts s where s.id = shift_id and s.closed_at is null
    )
    and (auth.uid() = performed_by_a or auth.uid() = performed_by_b)
  );

-- crew_briefings: read via crew.briefings (Admin schreibt via RPC)
drop policy if exists "crew_briefings_select" on public.crew_briefings;
create policy "crew_briefings_select"
  on public.crew_briefings for select
  using (public.crew_can('crew.briefings', 'read'));

-- crew_milestones: read via crew.meilensteine
drop policy if exists "crew_milestones_select" on public.crew_milestones;
create policy "crew_milestones_select"
  on public.crew_milestones for select
  using (public.crew_can('crew.meilensteine', 'read'));
