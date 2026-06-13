-- Energize Festival — Admin-Rolle + RLS fuer Moderation
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- 1. profiles.role
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text default 'user' not null
  check (role in ('user', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role)
  where role <> 'user';

----------------------------------------------------------------------
-- 2. is_admin() Helper-Funktion
--    security definer = laeuft im Postgres mit den Rechten des
--    Funktion-Owners (postgres), damit der Aufrufer (anon/authenticated)
--    auch eigene Rolle pruefen kann ohne select-RLS auf profiles fuer
--    role-Spalte.
----------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

----------------------------------------------------------------------
-- 3. RLS-Erweiterungen: Admin kann alles moderieren
----------------------------------------------------------------------

-- POSTS: Admins lesen pending/rejected (User-Policies blocken bisher),
--        Admins koennen status setzen.
drop policy if exists "admins read all posts" on public.posts;
create policy "admins read all posts"
  on public.posts for select
  using (public.is_admin());

drop policy if exists "admins update all posts" on public.posts;
create policy "admins update all posts"
  on public.posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete all posts" on public.posts;
create policy "admins delete all posts"
  on public.posts for delete
  using (public.is_admin());

-- REPORTS: Admins lesen alle, koennen abarbeiten (= loeschen).
drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports"
  on public.reports for select
  using (public.is_admin());

drop policy if exists "admins delete reports" on public.reports;
create policy "admins delete reports"
  on public.reports for delete
  using (public.is_admin());

-- FEEDBACK: Admins lesen alle Einsendungen (Veranstalter-Auswertung).
drop policy if exists "admins read all feedback" on public.feedback;
create policy "admins read all feedback"
  on public.feedback for select
  using (public.is_admin());

-- PROFILES: Admins lesen die role-Spalte aller User (fuer User-Liste
-- spaeter — nicht jetzt aktiv genutzt, aber Schema-konsistent).
-- Die "profiles are viewable by everyone" Policy aus 0001 deckt das
-- schon ab, da role öffentlich ist.

----------------------------------------------------------------------
-- 4. Storage: Admins koennen auch fremde Files loeschen
--    (z.B. Reject-Workflow räumt Storage)
----------------------------------------------------------------------
drop policy if exists "admins delete any post-file" on storage.objects;
create policy "admins delete any post-file"
  on storage.objects for delete
  using (bucket_id = 'posts' and public.is_admin());

----------------------------------------------------------------------
-- 5. Wie wird man Admin?
--    Per SQL auf den eigenen User (User-ID aus auth.users):
--
--    update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'deine@email.de');
--
--    Oder direkt mit deiner User-ID aus dem Account-Bereich.
----------------------------------------------------------------------
