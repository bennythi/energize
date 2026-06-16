-- Energize Festival — Crew-Briefings
-- Stand: 2026-06-16
--
-- Eine Sammlung von Briefing-Dokumenten pro Abteilung (Einlass,
-- Security Einlass, TopUp-Kassierer, Gastropersonal, Technik,
-- Supporter, ...). Body ist Markdown-Text. Alle Crew-Mitglieder
-- duerfen lesen, nur Admin darf anlegen, aendern, loeschen.

----------------------------------------------------------------------
-- 1. crew_briefings
----------------------------------------------------------------------
create table if not exists public.crew_briefings (
  id          uuid primary key default gen_random_uuid(),
  department  text not null check (length(department) between 2 and 80),
  title       text not null check (length(title) between 2 and 200),
  body        text not null default '' check (length(body) <= 50000),
  pinned      boolean not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists crew_briefings_department_idx
  on public.crew_briefings (department, pinned desc, updated_at desc);

----------------------------------------------------------------------
-- 2. RLS: Crew lesen, Admin schreibt via RPC
----------------------------------------------------------------------
alter table public.crew_briefings enable row level security;

drop policy if exists "crew_briefings_select" on public.crew_briefings;
create policy "crew_briefings_select"
  on public.crew_briefings for select
  using (public.is_crew());

----------------------------------------------------------------------
-- 3. admin_crew_briefing_upsert RPC
----------------------------------------------------------------------
create or replace function public.admin_crew_briefing_upsert(
  target_id        uuid,
  new_department   text,
  new_title        text,
  new_body         text,
  new_pinned       boolean
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
    insert into public.crew_briefings (department, title, body, pinned, updated_by)
      values (new_department, new_title, new_body, new_pinned, auth.uid())
      returning id into result_id;
  else
    update public.crew_briefings
      set department = new_department,
          title      = new_title,
          body       = new_body,
          pinned     = new_pinned,
          updated_at = now(),
          updated_by = auth.uid()
      where id = target_id
      returning id into result_id;
    if result_id is null then
      raise exception 'Briefing nicht gefunden' using errcode = 'P0002';
    end if;
  end if;
  return result_id;
end;
$$;

revoke all on function public.admin_crew_briefing_upsert(uuid, text, text, text, boolean) from public, anon;
grant execute on function public.admin_crew_briefing_upsert(uuid, text, text, text, boolean) to authenticated;

----------------------------------------------------------------------
-- 4. admin_crew_briefing_delete RPC
----------------------------------------------------------------------
create or replace function public.admin_crew_briefing_delete(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;
  delete from public.crew_briefings where id = target_id;
  if not found then
    raise exception 'Briefing nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_crew_briefing_delete(uuid) from public, anon;
grant execute on function public.admin_crew_briefing_delete(uuid) to authenticated;
