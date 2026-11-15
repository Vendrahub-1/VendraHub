create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
      from auth.users u
      where u.id = (select auth.uid())
        and u.email_confirmed_at is not null
    )
    and exists (
      select 1
      from public.admin_role_assignments ara
      join public.admin_profiles ap
        on ap.user_id = ara.user_id
       and ap.staff_status = 'active'
      where ara.user_id = (select auth.uid())
    );
$function$;

create or replace function private.has_admin_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
      from auth.users u
      where u.id = (select auth.uid())
        and u.email_confirmed_at is not null
    )
    and exists (
      select 1
      from public.admin_role_assignments ara
      join public.admin_profiles ap
        on ap.user_id = ara.user_id
       and ap.staff_status = 'active'
      join public.admin_role_permissions arp
        on arp.role_code = ara.role_code
      where ara.user_id = (select auth.uid())
        and arp.permission_code = permission_name
    );
$function$;
