-- Pin VendraHub super-admin access to the confirmed owner Auth identity.
-- The UUID below was verified against the existing Auth user for the allowlisted owner email.
do $$
declare
  owner_user_id constant uuid := 'b4c34a00-81ce-4782-bcf1-0736a9c497c4';
begin
  if not exists (
    select 1
    from auth.users u
    join public.admin_allowlist al
      on lower(al.email) = lower(u.email)
     and al.enabled
    where u.id = owner_user_id
      and lower(u.email) = 'vendrahub@hotmail.com'
      and u.email_confirmed_at is not null
  ) then
    raise exception 'Pinned VendraHub owner identity is missing, unconfirmed, or not enabled in admin_allowlist';
  end if;
end;
$$;

-- Remove any super-admin grant that is not attached to the pinned owner UUID.
update public.admin_profiles
set staff_status = 'inactive'
where user_id in (
  select ara.user_id
  from public.admin_role_assignments ara
  where ara.role_code = 'super_admin'
    and ara.user_id <> 'b4c34a00-81ce-4782-bcf1-0736a9c497c4'::uuid
);

delete from public.admin_role_assignments
where role_code = 'super_admin'
  and user_id <> 'b4c34a00-81ce-4782-bcf1-0736a9c497c4'::uuid;

-- Ensure the pinned owner remains active and retains the intended role.
insert into public.admin_profiles(user_id, staff_status)
values ('b4c34a00-81ce-4782-bcf1-0736a9c497c4'::uuid, 'active')
on conflict (user_id) do update
set staff_status = 'active';

insert into public.admin_role_assignments(user_id, role_code)
values ('b4c34a00-81ce-4782-bcf1-0736a9c497c4'::uuid, 'super_admin')
on conflict (user_id, role_code) do nothing;
