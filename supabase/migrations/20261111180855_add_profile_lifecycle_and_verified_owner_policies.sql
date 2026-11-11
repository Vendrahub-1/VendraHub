-- VendraHub lifecycle hardening and verified owner checks.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();
drop trigger if exists supplier_connections_set_updated_at on public.supplier_connections;
create trigger supplier_connections_set_updated_at before update on public.supplier_connections for each row execute function public.set_updated_at();
drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "support_tickets_select_customer_or_owner" on public.support_tickets;
drop policy if exists "support_tickets_select_customer_or_verified_owner" on public.support_tickets;
create policy "support_tickets_select_customer_or_verified_owner" on public.support_tickets
for select to authenticated using (
  (select auth.uid()) = user_id
  or (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com'
    and coalesce((select (auth.jwt()->>'email_verified')::boolean), false)
    and (select auth.jwt()->>'aal') = 'aal2')
);
drop policy if exists "support_tickets_owner_update" on public.support_tickets;
create policy "support_tickets_owner_update" on public.support_tickets for update to authenticated
using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com'
  and coalesce((select (auth.jwt()->>'email_verified')::boolean), false)
  and (select auth.jwt()->>'aal') = 'aal2')
with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com'
  and coalesce((select (auth.jwt()->>'email_verified')::boolean), false)
  and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "supplier_connections_owner_select" on public.supplier_connections;
drop policy if exists "supplier_connections_owner_insert" on public.supplier_connections;
drop policy if exists "supplier_connections_owner_update" on public.supplier_connections;
create policy "supplier_connections_owner_select" on public.supplier_connections for select to authenticated
using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');
create policy "supplier_connections_owner_insert" on public.supplier_connections for insert to authenticated
with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');
create policy "supplier_connections_owner_update" on public.supplier_connections for update to authenticated
using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2')
with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "store_settings_owner_select" on public.store_settings;
drop policy if exists "store_settings_owner_insert" on public.store_settings;
drop policy if exists "store_settings_owner_update" on public.store_settings;
create policy "store_settings_owner_select" on public.store_settings for select to authenticated
using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');
create policy "store_settings_owner_insert" on public.store_settings for insert to authenticated
with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');
create policy "store_settings_owner_update" on public.store_settings for update to authenticated
using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2')
with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists "audit_events_owner_select" on public.audit_events;
drop policy if exists "audit_events_owner_insert" on public.audit_events;
create policy "audit_events_owner_select" on public.audit_events for select to authenticated
using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');
create policy "audit_events_owner_insert" on public.audit_events for insert to authenticated
with check (actor_id = (select auth.uid()) and lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com'
  and coalesce((select (auth.jwt()->>'email_verified')::boolean), false) and (select auth.jwt()->>'aal') = 'aal2');
