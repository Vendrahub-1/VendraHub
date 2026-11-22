-- VendraHub owner access: password + TOTP MFA, without email confirmation.
-- Owner status remains restricted to the explicitly enabled admin allowlist.
-- Every database admin check continues to require an AAL2 JWT.

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

create or replace function private.handle_new_vendrahub_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles(id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    lower(new.email)
  )
  on conflict(id) do update set email = excluded.email;

  insert into public.customers(user_id, email, first_name, last_name)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict(user_id) do update set email = excluded.email;

  insert into public.customer_role_assignments(user_id, role_code)
  values(new.id, 'customer')
  on conflict do nothing;

  if exists (
    select 1
    from public.admin_allowlist
    where email = lower(new.email)
      and enabled
  ) then
    insert into public.admin_profiles(user_id, display_name)
    values(
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
    )
    on conflict(user_id) do update set staff_status = 'active';

    insert into public.admin_role_assignments(user_id, role_code)
    values(new.id, 'super_admin')
    on conflict do nothing;
  end if;

  return new;
end;
$function$;

-- Bootstrap only accounts already present in auth.users whose exact email
-- is enabled in the admin allowlist. AAL2 remains mandatory for all admin access.
insert into public.admin_profiles(user_id)
select u.id
from auth.users u
join public.admin_allowlist al
  on al.email = lower(u.email)
 and al.enabled
on conflict(user_id) do update set staff_status = 'active';

insert into public.admin_role_assignments(user_id, role_code)
select u.id, 'super_admin'
from auth.users u
join public.admin_allowlist al
  on al.email = lower(u.email)
 and al.enabled
on conflict do nothing;
