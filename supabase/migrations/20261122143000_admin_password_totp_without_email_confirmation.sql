-- VendraHub owner access: password + TOTP MFA, without email confirmation.
-- The enabled admin allowlist is retained, but public signup must NEVER
-- automatically grant the super_admin role based on an email address alone.
-- Existing allowlisted owner is bootstrapped below; AAL2 remains mandatory.

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

-- Keep normal customer profile/role creation, but do not grant admin on signup.
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

  return new;
end;
$function$;

-- Disable the old email-confirmation promotion trigger's grant behavior.
-- This prevents email confirmation state or public signup from being an admin grant path.
create or replace function private.promote_confirmed_allowlisted_owner()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  return new;
end;
$function$;

-- Bootstrap only the existing Auth user that is already on the enabled allowlist.
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
