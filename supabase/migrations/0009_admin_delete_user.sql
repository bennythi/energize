-- Energize Festival — Admin kann User komplett loeschen
-- Stand: 2026-06-13

----------------------------------------------------------------------
-- admin_delete_user() — loescht aus auth.users, der CASCADE-Trigger
-- auf profiles.id räumt das public-Schema mit (posts, follows, etc.)
--
-- Schutz:
--  - is_admin()-Check
--  - Founder-Account (benjamin.thiel@outlook.com) ist geprotected
--  - Self-Delete blockiert (kein Lockout-Risiko)
----------------------------------------------------------------------
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'Nicht autorisiert' using errcode = '42501';
  end if;

  select email::text into target_email
    from auth.users where id = target_user_id;

  if target_email is null then
    raise exception 'User nicht gefunden' using errcode = 'P0002';
  end if;

  if target_email = 'benjamin.thiel@outlook.com' then
    raise exception 'Founder-Account kann nicht geloescht werden'
      using errcode = '42501';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'Du kannst dich nicht selbst loeschen'
      using errcode = '42501';
  end if;

  -- Reports separat (kein cascade da reports.user_id auf profiles.id
  -- zeigt, profiles werden gleich mit cascaded — das ist OK)
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
