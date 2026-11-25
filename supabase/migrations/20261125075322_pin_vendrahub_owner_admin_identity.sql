-- Pin VendraHub super-admin access to the pre-existing owner Auth identity.
-- An enabled email allowlist is not sufficient proof of identity by itself.
-- This UUID was read from the existing owner Auth record in this project.
do $$
declare
  owner_user_id constant uuid := '89992f03-ebcd-4290-833a-eb10e4eb4582';
begin
  if not exists (
    select 1
    from auth.users u
    join public.admin_allowlist al
      on al.email = lower(u.email)
     and al.enabled
    where u.id = owner_user_id
      and lower(u.email) = 'vendrahub@hotmail.com'
  ) then
    raise exception 'Pinned VendraHub owner identity is missing or is not enabled in admin_allowlist';
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
    and ara.user_id <> '89992f03-ebcd-4290-833a-eb10e4eb4582'::uuid
);

delete from public.admin_role_assignments
where role_code = 'super_admin'
  and user_id <> '89992f03-ebcd-4290-833a-eb10e4eb4582'::uuid;

-- Ensure the pinned owner remains active and retains the intended role.
insert into public.admin_profiles(user_id)
values ('89992f03-ebcd-4290-833a-eb10e4eb4582'::uuid)
on conflict (user_id) do update
set staff_status = 'active';

insert into public.admin_role_assignments(user_id, role_code)
values ('89992f03-ebcd-4290-833a-eb10e4eb4582'::uuid, 'super_admin')
on conflict do nothing;
