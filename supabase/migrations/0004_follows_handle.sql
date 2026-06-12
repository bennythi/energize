-- Energize Festival — Community: Follows + searchable handle
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- 1. profiles.handle — eindeutiger, suchbarer Username
--    (display_name kann doppeln, handle nicht)
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists handle text;

create unique index if not exists profiles_handle_unique
  on public.profiles (lower(handle))
  where handle is not null;

-- Volltext-Suche auf display_name + handle (Trigram fuer ILIKE %x%)
create extension if not exists pg_trgm;

create index if not exists profiles_display_name_trgm
  on public.profiles using gin (display_name gin_trgm_ops);

create index if not exists profiles_handle_trgm
  on public.profiles using gin (handle gin_trgm_ops);

----------------------------------------------------------------------
-- 2. follows: Wer-folgt-wem
----------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

-- Wer wem folgt ist öffentlich (Profil-Seite zeigt Follower-Counts)
drop policy if exists "follows public read" on public.follows;
create policy "follows public read"
  on public.follows for select
  using (true);

-- Nur eigene Follows verwalten
drop policy if exists "users manage own follows" on public.follows;
create policy "users manage own follows"
  on public.follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

----------------------------------------------------------------------
-- 3. posts/profile-Read fuer Foto-Wall-Author-Anzeige verbessern
--    post_likes-Count haben wir schon aus 0001
----------------------------------------------------------------------

-- Index fuer post-Liste sortiert nach created_at (war schon, redundancy check)
create index if not exists posts_created_idx
  on public.posts (created_at desc);
