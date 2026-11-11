create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home' check (char_length(label) between 1 and 40),
  recipient_name text not null check (char_length(recipient_name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 40),
  address_line1 text not null check (char_length(address_line1) between 3 and 200),
  address_line2 text,
  city text not null check (char_length(city) between 1 and 100),
  state_region text,
  postal_code text,
  country text not null check (char_length(country) between 2 and 100),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id, created_at desc);
create unique index if not exists customer_addresses_one_default_idx on public.customer_addresses(user_id) where is_default;
alter table public.customer_addresses enable row level security;
create policy "customer_addresses_select_own" on public.customer_addresses for select to authenticated using ((select auth.uid()) = user_id);
create policy "customer_addresses_insert_own" on public.customer_addresses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "customer_addresses_update_own" on public.customer_addresses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customer_addresses_delete_own" on public.customer_addresses for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.customer_addresses to authenticated;
drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
