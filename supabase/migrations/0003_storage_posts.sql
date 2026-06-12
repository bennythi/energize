-- Energize Festival — Storage-Bucket "posts" fuer die Foto-Wall
-- Stand: 2026-06-13
--
-- Nach 0002_feedback.sql im SQL-Editor laufen lassen.
-- HINWEIS: Storage-Buckets können im Dashboard auch via UI angelegt werden:
--   Storage → Create bucket → Name "posts" → Public bucket aktivieren.
-- Wenn der Bucket per UI angelegt wurde, das insert-Statement weglassen
-- (oder mit "on conflict do nothing" gemacht — siehe unten).

----------------------------------------------------------------------
-- 1. Bucket "posts" (public — Files sind via CDN-URL ohne Auth abrufbar;
--    die App zeigt nur approved-Posts an, RLS auf der posts-Tabelle filtert)
----------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posts',
  'posts',
  true,
  8388608,  -- 8 MB pro File
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

----------------------------------------------------------------------
-- 2. Storage-RLS-Policies fuer storage.objects
--    Pfad-Konvention: "<user_id>/<random-uuid>.<ext>"
----------------------------------------------------------------------

-- Public read (der Bucket ist public, das macht die Policy explizit)
drop policy if exists "posts_public_read" on storage.objects;
create policy "posts_public_read"
  on storage.objects for select
  using (bucket_id = 'posts');

-- User darf in seinen eigenen Folder uploaden
drop policy if exists "posts_user_upload" on storage.objects;
create policy "posts_user_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- User darf eigene Files loeschen (z.B. nach Reject vom Moderator)
drop policy if exists "posts_user_delete" on storage.objects;
create policy "posts_user_delete"
  on storage.objects for delete
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
