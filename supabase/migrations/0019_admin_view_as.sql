-- Energize Festival — Admin "View as"-RPCs
-- Stand: 2026-06-16
--
-- Erlaubt einem Admin, das Profil und die effektiven Permissions eines
-- anderen Users abzurufen, um die App aus dessen Sicht anzuzeigen.
-- Die Admin-Session bleibt bestehen, RLS-Checks im Backend laufen
-- weiter als Admin. Die UI nutzt diese Daten nur fuer Anzeige.

----------------------------------------------------------------------
-- 1. admin_view_user_profile
----------------------------------------------------------------------
create or replace function public.admin_view_user_profile(target_user_id uuid)
returns table (
  user_id      uuid,
  email        text,
  display_name text,
  role         text,
  is_crew      boolean,
  crew_roles   text[]
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.display_name,
    p.role,
    p.is_crew,
    p.crew_roles
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target_user_id
    and public.is_admin();
$$;

revoke all on function public.admin_view_user_profile(uuid) from public, anon;
grant execute on function public.admin_view_user_profile(uuid) to authenticated;

----------------------------------------------------------------------
-- 2. admin_view_user_permissions
----------------------------------------------------------------------
create or replace function public.admin_view_user_permissions(target_user_id uuid)
returns table (
  resource_slug text,
  level         text
)
language sql
security definer
stable
set search_path = public
as $$
  with target_profile as (
    select role, crew_roles from public.profiles where id = target_user_id
  )
  select r.slug,
    case max(
      case lvl
        when 'delete' then 3
        when 'write' then 2
        else 1
      end
    )
    when 3 then 'delete'
    when 2 then 'write'
    else 'read'
    end
  from public.crew_resources r
  left join lateral (
    select 'delete'::text as lvl from target_profile where role = 'admin'
    union all
    select level::text from public.crew_user_permissions
      where user_id = target_user_id and resource_slug = r.slug
    union all
    select rp.level::text from public.crew_role_permissions rp, target_profile mp
      where rp.resource_slug = r.slug and rp.role = any(mp.crew_roles)
  ) sub on true
  where sub.lvl is not null
    and public.is_admin()
  group by r.slug;
$$;

revoke all on function public.admin_view_user_permissions(uuid) from public, anon;
grant execute on function public.admin_view_user_permissions(uuid) to authenticated;
