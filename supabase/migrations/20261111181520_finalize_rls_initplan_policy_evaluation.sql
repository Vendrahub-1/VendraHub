-- Evaluate the JWT once per statement in owner-only RLS predicates.
drop policy if exists "support_tickets_select_customer_or_verified_owner" on public.support_tickets;
create policy "support_tickets_select_customer_or_verified_owner" on public.support_tickets
for select to authenticated using (
  (select auth.uid()) = user_id
  or (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com'
    and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false)
    and (select auth.jwt()) ->> 'aal' = 'aal2')
);
drop policy if exists "support_tickets_owner_update" on public.support_tickets;
create policy "support_tickets_owner_update" on public.support_tickets for update to authenticated
using (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com'
  and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false)
  and (select auth.jwt()) ->> 'aal' = 'aal2')
with check (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com'
  and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false)
  and (select auth.jwt()) ->> 'aal' = 'aal2');

drop policy if exists "supplier_connections_owner_select" on public.supplier_connections;
drop policy if exists "supplier_connections_owner_insert" on public.supplier_connections;
drop policy if exists "supplier_connections_owner_update" on public.supplier_connections;
create policy "supplier_connections_owner_select" on public.supplier_connections for select to authenticated
using (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');
create policy "supplier_connections_owner_insert" on public.supplier_connections for insert to authenticated
with check (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');
create policy "supplier_connections_owner_update" on public.supplier_connections for update to authenticated
using (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2')
with check (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');

drop policy if exists "store_settings_owner_select" on public.store_settings;
drop policy if exists "store_settings_owner_insert" on public.store_settings;
drop policy if exists "store_settings_owner_update" on public.store_settings;
create policy "store_settings_owner_select" on public.store_settings for select to authenticated
using (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');
create policy "store_settings_owner_insert" on public.store_settings for insert to authenticated
with check (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');
create policy "store_settings_owner_update" on public.store_settings for update to authenticated
using (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2')
with check (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');

drop policy if exists "audit_events_owner_select" on public.audit_events;
drop policy if exists "audit_events_owner_insert" on public.audit_events;
create policy "audit_events_owner_select" on public.audit_events for select to authenticated
using (lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com' and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');
create policy "audit_events_owner_insert" on public.audit_events for insert to authenticated
with check ((select auth.uid()) = actor_id and lower((select auth.jwt()) ->> 'email') = 'vendrahub@hotmail.com'
  and coalesce(((select auth.jwt()) ->> 'email_verified')::boolean, false) and (select auth.jwt()) ->> 'aal' = 'aal2');
