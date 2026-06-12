-- Energize Festival — Feedback-Tabelle für Edition-Reviews
-- Stand: 2026-06-12
--
-- Nach 0001_initial.sql im SQL-Editor laufen lassen.

create table public.feedback (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  edition       text not null,
  rating        smallint check (rating between 1 and 5),
  liked         text,
  disliked      text,
  improvements  text,
  would_return  text check (would_return in ('yes', 'maybe', 'no')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, edition)
);

create index feedback_edition_idx on public.feedback (edition, created_at desc);

-- updated_at automatisch nachführen
create or replace function public.set_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_feedback_updated_at();

alter table public.feedback enable row level security;

-- User sieht/manipuliert nur eigenes Feedback.
-- Veranstalter-Auswertung läuft über Service-Role-Key im Sanity-Mod-Tool.

create policy "users see their own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "users insert their own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "users update their own feedback"
  on public.feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete their own feedback"
  on public.feedback for delete
  using (auth.uid() = user_id);
