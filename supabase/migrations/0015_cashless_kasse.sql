-- Energize Festival — Cashless-Kassen-Abrechnung
-- Stand: 2026-06-16
--
-- Konzept:
--   - cashless_registers: Stammdaten der einzelnen Top-Up-Kassen.
--   - cashless_shifts: ein Oeffnen-Schliessen-Vorgang pro Kasse.
--     Vier-Augen-Prinzip: opened_by_a + opened_by_b, beim Schliessen
--     closed_by_a + closed_by_b. Immer zwei verschiedene Crew-Mitglieder.
--   - cashless_shift_denominations: erfasste Stueckelungen pro Schicht,
--     einmal als Startbestand und einmal als Endbestand.
--   - cashless_movements: Bewegungen waehrend der Schicht. Entnahmen
--     (Geld raus, z.B. an den Tresor) und Wechsel zwischen Kassen.
--     Auch hier doppelte Unterschrift.
--
-- Rechte:
--   - is_topup_kassierer() = role = 'admin' ODER 'topup_kassierer'
--     ist in profiles.crew_roles enthalten.
--   - Nur is_topup_kassierer() darf lesen, Schichten oeffnen, Bewegungen
--     erfassen und Schichten schliessen.
--   - Stammdaten (Kassen anlegen/aendern) nur fuer Admin via RPC.

----------------------------------------------------------------------
-- 1. cashless_registers
----------------------------------------------------------------------
create table if not exists public.cashless_registers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 2 and 80),
  location    text check (location is null or length(location) <= 120),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists cashless_registers_active_idx
  on public.cashless_registers (is_active, name);

----------------------------------------------------------------------
-- 2. cashless_shifts
----------------------------------------------------------------------
create table if not exists public.cashless_shifts (
  id                     uuid primary key default gen_random_uuid(),
  register_id            uuid not null references public.cashless_registers(id) on delete restrict,
  opened_at              timestamptz not null default now(),
  opened_by_a            uuid not null references public.profiles(id) on delete restrict,
  opened_by_b            uuid not null references public.profiles(id) on delete restrict,
  closed_at              timestamptz,
  closed_by_a            uuid references public.profiles(id) on delete restrict,
  closed_by_b            uuid references public.profiles(id) on delete restrict,
  starting_cents         bigint not null check (starting_cents >= 0),
  ending_cents           bigint check (ending_cents is null or ending_cents >= 0),
  note                   text check (note is null or length(note) <= 1000),
  constraint shifts_open_pair_distinct check (opened_by_a <> opened_by_b),
  constraint shifts_close_pair_distinct check (
    closed_at is null
    or (closed_by_a is not null and closed_by_b is not null and closed_by_a <> closed_by_b)
  )
);

create index if not exists cashless_shifts_register_idx
  on public.cashless_shifts (register_id, opened_at desc);
create index if not exists cashless_shifts_open_idx
  on public.cashless_shifts (register_id) where closed_at is null;

----------------------------------------------------------------------
-- 3. cashless_shift_denominations
--    denomination_cents nimmt EUR-Stueckelungen in Cent:
--    50000=500€, 20000=200€, ..., 1=1ct
----------------------------------------------------------------------
create table if not exists public.cashless_shift_denominations (
  id                  uuid primary key default gen_random_uuid(),
  shift_id            uuid not null references public.cashless_shifts(id) on delete cascade,
  kind                text not null check (kind in ('start', 'end')),
  denomination_cents  integer not null check (
    denomination_cents in (50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1)
  ),
  count               integer not null default 0 check (count >= 0),
  unique (shift_id, kind, denomination_cents)
);

create index if not exists cashless_denoms_shift_idx
  on public.cashless_shift_denominations (shift_id, kind);

----------------------------------------------------------------------
-- 4. cashless_movements
----------------------------------------------------------------------
create table if not exists public.cashless_movements (
  id                       uuid primary key default gen_random_uuid(),
  shift_id                 uuid not null references public.cashless_shifts(id) on delete cascade,
  kind                     text not null check (kind in ('withdrawal', 'exchange_in', 'exchange_out')),
  amount_cents             bigint not null check (amount_cents > 0),
  counterpart_register_id  uuid references public.cashless_registers(id) on delete restrict,
  performed_at             timestamptz not null default now(),
  performed_by_a           uuid not null references public.profiles(id) on delete restrict,
  performed_by_b           uuid not null references public.profiles(id) on delete restrict,
  note                     text check (note is null or length(note) <= 500),
  constraint movements_pair_distinct check (performed_by_a <> performed_by_b)
);

create index if not exists cashless_movements_shift_idx
  on public.cashless_movements (shift_id, performed_at);

----------------------------------------------------------------------
-- 5. is_topup_kassierer() helper
----------------------------------------------------------------------
create or replace function public.is_topup_kassierer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or 'topup_kassierer' = any(crew_roles))
  );
$$;

revoke all on function public.is_topup_kassierer() from public, anon;
grant execute on function public.is_topup_kassierer() to authenticated;

----------------------------------------------------------------------
-- 6. RLS
----------------------------------------------------------------------
alter table public.cashless_registers enable row level security;
alter table public.cashless_shifts enable row level security;
alter table public.cashless_shift_denominations enable row level security;
alter table public.cashless_movements enable row level security;

-- registers: Kassierer lesen, schreiben nur via Admin-RPC
drop policy if exists "cashless_registers_select" on public.cashless_registers;
create policy "cashless_registers_select"
  on public.cashless_registers for select
  using (public.is_topup_kassierer());

-- shifts
drop policy if exists "cashless_shifts_select" on public.cashless_shifts;
create policy "cashless_shifts_select"
  on public.cashless_shifts for select
  using (public.is_topup_kassierer());

drop policy if exists "cashless_shifts_insert" on public.cashless_shifts;
create policy "cashless_shifts_insert"
  on public.cashless_shifts for insert
  with check (
    public.is_topup_kassierer()
    and (auth.uid() = opened_by_a or auth.uid() = opened_by_b)
  );

drop policy if exists "cashless_shifts_update" on public.cashless_shifts;
create policy "cashless_shifts_update"
  on public.cashless_shifts for update
  using (public.is_topup_kassierer())
  with check (public.is_topup_kassierer());

-- shift_denominations: Kassierer sehen alle, koennen anlegen + aendern
-- solange die zugehoerige Schicht noch offen ist. End-Bestand darf auch
-- gleichzeitig mit dem Schliessen geschrieben werden.
drop policy if exists "cashless_denoms_select" on public.cashless_shift_denominations;
create policy "cashless_denoms_select"
  on public.cashless_shift_denominations for select
  using (public.is_topup_kassierer());

drop policy if exists "cashless_denoms_insert" on public.cashless_shift_denominations;
create policy "cashless_denoms_insert"
  on public.cashless_shift_denominations for insert
  with check (
    public.is_topup_kassierer()
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
    public.is_topup_kassierer()
    and exists (
      select 1 from public.cashless_shifts s where s.id = shift_id and s.closed_at is null
    )
  );

-- movements: Kassierer sehen alle, koennen einfuegen wenn Schicht offen
-- und eigene UID einer der beiden Performer ist
drop policy if exists "cashless_movements_select" on public.cashless_movements;
create policy "cashless_movements_select"
  on public.cashless_movements for select
  using (public.is_topup_kassierer());

drop policy if exists "cashless_movements_insert" on public.cashless_movements;
create policy "cashless_movements_insert"
  on public.cashless_movements for insert
  with check (
    public.is_topup_kassierer()
    and exists (
      select 1 from public.cashless_shifts s where s.id = shift_id and s.closed_at is null
    )
    and (auth.uid() = performed_by_a or auth.uid() = performed_by_b)
  );

----------------------------------------------------------------------
-- 7. admin_cashless_register_upsert RPC
----------------------------------------------------------------------
create or replace function public.admin_cashless_register_upsert(
  target_id     uuid,
  new_name      text,
  new_location  text,
  new_active    boolean
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
    insert into public.cashless_registers (name, location, is_active)
      values (new_name, new_location, new_active)
      returning id into result_id;
  else
    update public.cashless_registers
      set name      = new_name,
          location  = new_location,
          is_active = new_active
      where id = target_id
      returning id into result_id;
    if result_id is null then
      raise exception 'Kasse nicht gefunden' using errcode = 'P0002';
    end if;
  end if;
  return result_id;
end;
$$;

revoke all on function public.admin_cashless_register_upsert(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_cashless_register_upsert(uuid, text, text, boolean) to authenticated;

----------------------------------------------------------------------
-- 8. cashless_shift_summary RPC: berechnet expected_ending_cents aus
--    starting_cents + Bewegungen und liefert die Differenz, sobald
--    der Endbestand erfasst ist.
----------------------------------------------------------------------
create or replace function public.cashless_shift_summary(target_shift_id uuid)
returns table (
  shift_id            uuid,
  starting_cents      bigint,
  movement_in_cents   bigint,
  movement_out_cents  bigint,
  expected_cents      bigint,
  ending_cents        bigint,
  difference_cents    bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with mv as (
    select
      coalesce(sum(case when kind = 'exchange_in' then amount_cents else 0 end), 0)::bigint as inn,
      coalesce(sum(case when kind in ('exchange_out', 'withdrawal') then amount_cents else 0 end), 0)::bigint as outn
    from public.cashless_movements
    where shift_id = target_shift_id
  )
  select
    s.id,
    s.starting_cents,
    mv.inn,
    mv.outn,
    (s.starting_cents + mv.inn - mv.outn)::bigint as expected_cents,
    s.ending_cents,
    case when s.ending_cents is null then null
         else (s.ending_cents - (s.starting_cents + mv.inn - mv.outn))::bigint end as difference_cents
  from public.cashless_shifts s, mv
  where s.id = target_shift_id
    and public.is_topup_kassierer();
$$;

revoke all on function public.cashless_shift_summary(uuid) from public, anon;
grant execute on function public.cashless_shift_summary(uuid) to authenticated;
