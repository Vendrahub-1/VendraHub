-- VendraHub customer and owner-admin backend foundation.
-- Public customers can access only their own profile, tickets and wishlist.
-- Owner-only operational tables require the verified owner email and AAL2.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) <= 120)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_subject_length check (char_length(subject) between 3 and 160),
  constraint support_tickets_message_length check (char_length(message) between 10 and 5000)
);
create index if not exists support_tickets_user_created_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_created_idx on public.support_tickets (status, created_at desc);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shopify_product_gid text not null,
  created_at timestamptz not null default now(),
  constraint wishlist_product_gid_length check (char_length(shopify_product_gid) between 1 and 255),
  constraint wishlist_user_product_unique unique (user_id, shopify_product_gid)
);
create index if not exists wishlist_items_user_created_idx on public.wishlist_items (user_id, created_at desc);

create table if not exists public.supplier_connections (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null unique check (supplier_code in ('syncee', 'dsers', 'cjdropshipping')),
  connection_status text not null default 'not_connected'
    check (connection_status in ('not_connected', 'pending_authorisation', 'connected', 'error', 'disabled')),
  integration_method text not null default 'shopify_app' check (integration_method in ('shopify_app', 'direct_api')),
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint store_settings_key_length check (char_length(setting_key) between 1 and 100)
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  outcome text not null default 'success' check (outcome in ('success', 'denied', 'failure')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_action_length check (char_length(action) between 1 and 120),
  constraint audit_resource_type_length check (char_length(resource_type) between 1 and 80)
);
create index if not exists audit_events_actor_created_idx on public.audit_events (actor_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.support_tickets enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.supplier_connections enable row level security;
alter table public.store_settings enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "support_tickets_customer_insert_own" on public.support_tickets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "support_tickets_select_customer_or_owner" on public.support_tickets for select to authenticated using (
  (select auth.uid()) = user_id
  or (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2')
);
create policy "support_tickets_owner_update" on public.support_tickets for update to authenticated
  using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2')
  with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');

create policy "wishlist_select_own" on public.wishlist_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "wishlist_insert_own" on public.wishlist_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wishlist_delete_own" on public.wishlist_items for delete to authenticated using ((select auth.uid()) = user_id);

create policy "supplier_connections_owner_select" on public.supplier_connections for select to authenticated
  using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');
create policy "supplier_connections_owner_insert" on public.supplier_connections for insert to authenticated
  with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');
create policy "supplier_connections_owner_update" on public.supplier_connections for update to authenticated
  using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2')
  with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');

create policy "store_settings_owner_select" on public.store_settings for select to authenticated
  using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');
create policy "store_settings_owner_insert" on public.store_settings for insert to authenticated
  with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');
create policy "store_settings_owner_update" on public.store_settings for update to authenticated
  using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2')
  with check (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');

create policy "audit_events_owner_select" on public.audit_events for select to authenticated
  using (lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');
create policy "audit_events_owner_insert" on public.audit_events for insert to authenticated
  with check (actor_id = (select auth.uid()) and lower((select auth.jwt()->>'email')) = 'vendrahub@hotmail.com' and (select auth.jwt()->>'aal') = 'aal2');

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.support_tickets to authenticated;
grant select, insert, delete on public.wishlist_items to authenticated;
grant select, insert, update on public.supplier_connections to authenticated;
grant select, insert, update on public.store_settings to authenticated;
grant select, insert on public.audit_events to authenticated;
