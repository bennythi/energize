-- Energize Festival 2027 — Initial Schema
-- Stand: 2026-06-08
--
-- Tabellen aus packages/supabase-client/src/types.ts:
--   profiles, favorites, posts, post_likes, reports
--
-- Auf neuem Supabase-Projekt im SQL-Editor ausführen, oder via Supabase-CLI:
--   supabase db push

----------------------------------------------------------------------
-- profiles: 1:1 Spiegel von auth.users mit App-spezifischen Feldern
----------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale       text check (locale in ('de', 'en')),
  push_token   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Display-Name ist öffentlich (für Foto-Wall-Anzeige etc.)
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-Insert: nach Sign-Up in auth.users wird Profil-Zeile angelegt.
-- locale kommt aus options.data.locale beim signInWithOtp-Call.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'locale', 'de')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

----------------------------------------------------------------------
-- favorites: Lineup-Favoriten je User
-- artist_id zeigt auf Sanity-Document-ID (string, kein FK)
----------------------------------------------------------------------
create table public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  artist_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

alter table public.favorites enable row level security;

create policy "users see only their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "users manage only their own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

----------------------------------------------------------------------
-- posts: Foto-Wall-Beiträge (User-Upload, manuelle Moderation)
----------------------------------------------------------------------
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  image_path text not null,
  caption    text,
  status     text not null default 'pending'
             check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index posts_status_created_idx
  on public.posts (status, created_at desc);

create index posts_user_idx
  on public.posts (user_id, created_at desc);

alter table public.posts enable row level security;

-- Approved Posts sind öffentlich (Foto-Wall lesbar ohne Login).
create policy "approved posts are public"
  on public.posts for select
  using (status = 'approved');

-- Eigene Posts sieht der Autor immer (auch pending/rejected).
create policy "users see their own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "users insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "users delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- status wird nur von Sanity-Mod-Tool via Service-Role geändert — keine
-- update-Policy für anon/authenticated.

----------------------------------------------------------------------
-- post_likes
----------------------------------------------------------------------
create table public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_post_idx on public.post_likes (post_id);

alter table public.post_likes enable row level security;

create policy "likes are publicly readable"
  on public.post_likes for select
  using (true);

create policy "users manage only their own likes"
  on public.post_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

----------------------------------------------------------------------
-- reports: Meldungen für Foto-Wall-Moderation
----------------------------------------------------------------------
create table public.reports (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  reason     text not null,
  created_at timestamptz not null default now()
);

create index reports_post_idx on public.reports (post_id);

alter table public.reports enable row level security;

-- Niemand außer Service-Role darf Reports lesen.
-- Authentifizierte User dürfen Reports erstellen.
create policy "users may insert reports"
  on public.reports for insert
  with check (auth.uid() = user_id);
