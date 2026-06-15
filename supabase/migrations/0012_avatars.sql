-- Energize Festival — Profilbild-Upload
-- Stand: 2026-06-15

----------------------------------------------------------------------
-- 1. profiles.avatar_path
--    Speichert Storage-Pfad (z.B. "<user_id>/avatar-<uuid>.jpg"),
--    NICHT die volle URL. Die URL wird im Client gebaut.
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_check;
alter table public.profiles
  add constraint profiles_avatar_path_check
  check (avatar_path is null or length(avatar_path) between 5 and 250);

----------------------------------------------------------------------
-- 2. Bucket "avatars"
--    Public, weil Profilbilder ueberall (Wall, /u/[id], /community)
--    angezeigt werden und CDN-URLs cachebar bleiben sollen.
----------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  4194304,  -- 4 MB pro File (Profilbilder sind kleiner als Foto-Wall-Posts)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

----------------------------------------------------------------------
-- 3. Storage-RLS-Policies fuer "avatars"
--    Pfad-Konvention: "<user_id>/avatar-<uuid>.jpg"
----------------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_user_upload" on storage.objects;
create policy "avatars_user_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

----------------------------------------------------------------------
-- 4. profiles_public View um avatar_path erweitern
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
    festivals_attended,
    avatar_path,
    created_at
  from public.profiles;

grant select on public.profiles_public to anon, authenticated;
