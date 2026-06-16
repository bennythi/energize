-- Energize Festival — Crew-Meilensteine / Deadlines (Jahreskalender)
-- Stand: 2026-06-16
--
-- Liste mit Termin-Vorgaben fuer die Organisation: Bestellungen
-- (Feuerwerk, Funkgeraete, Baufahrzeuge, Toiletten), Vertraege,
-- Genehmigungen, Lieferungen. Alle Crew sieht alle Meilensteine.
-- Admin legt sie an + aendert sie. Jede Crew darf einen Meilenstein
-- als erledigt markieren oder zurueck auf offen setzen.

----------------------------------------------------------------------
-- 1. crew_milestones
----------------------------------------------------------------------
create table if not exists public.crew_milestones (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(title) between 2 and 200),
  description   text check (description is null or length(description) <= 4000),
  category      text not null check (length(category) between 2 and 80),
  due_date      date not null,
  completed_at  timestamptz,
  completed_by  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id) on delete set null
);

create index if not exists crew_milestones_due_idx
  on public.crew_milestones (due_date, completed_at);
create index if not exists crew_milestones_open_idx
  on public.crew_milestones (due_date) where completed_at is null;

----------------------------------------------------------------------
-- 2. RLS
----------------------------------------------------------------------
alter table public.crew_milestones enable row level security;

drop policy if exists "crew_milestones_select" on public.crew_milestones;
create policy "crew_milestones_select"
  on public.crew_milestones for select
  using (public.is_crew());

-- Crew darf NUR completed_at + completed_by toggeln, alles andere ist Admin.
-- Wir setzen das via RPC um, deshalb keine UPDATE-Policy.

----------------------------------------------------------------------
-- 3. admin_crew_milestone_upsert RPC
----------------------------------------------------------------------
create or replace function public.admin_crew_milestone_upsert(
  target_id        uuid,
  new_title        text,
  new_description  text,
  new_category     text,
  new_due_date     date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  if target_id is null then
    insert into public.crew_milestones (title, description, category, due_date, created_by)
      values (new_title, new_description, new_category, new_due_date, auth.uid())
      returning id into result_id;
  else
    update public.crew_milestones
      set title       = new_title,
          description = new_description,
          category    = new_category,
          due_date    = new_due_date
      where id = target_id
      returning id into result_id;
    if result_id is null then
      raise exception 'Meilenstein nicht gefunden' using errcode = 'P0002';
    end if;
  end if;
  return result_id;
end;
$$;

revoke all on function public.admin_crew_milestone_upsert(uuid, text, text, text, date) from public, anon;
grant execute on function public.admin_crew_milestone_upsert(uuid, text, text, text, date) to authenticated;

----------------------------------------------------------------------
-- 4. admin_crew_milestone_delete RPC
----------------------------------------------------------------------
create or replace function public.admin_crew_milestone_delete(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;
  delete from public.crew_milestones where id = target_id;
  if not found then
    raise exception 'Meilenstein nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_crew_milestone_delete(uuid) from public, anon;
grant execute on function public.admin_crew_milestone_delete(uuid) to authenticated;

----------------------------------------------------------------------
-- 5. crew_milestone_set_completed RPC
--    Jede Crew darf Status togglen. completed=true setzt completed_at
--    auf now() und completed_by auf den aktuellen User. completed=false
--    macht beides null.
----------------------------------------------------------------------
create or replace function public.crew_milestone_set_completed(
  target_id  uuid,
  completed  boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_crew() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  if completed then
    update public.crew_milestones
      set completed_at = now(),
          completed_by = auth.uid()
      where id = target_id;
  else
    update public.crew_milestones
      set completed_at = null,
          completed_by = null
      where id = target_id;
  end if;

  if not found then
    raise exception 'Meilenstein nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.crew_milestone_set_completed(uuid, boolean) from public, anon;
grant execute on function public.crew_milestone_set_completed(uuid, boolean) to authenticated;
