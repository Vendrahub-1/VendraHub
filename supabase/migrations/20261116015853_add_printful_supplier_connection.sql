-- Add Printful to the supplier registry.
-- The Printful API credential remains in Supabase Edge Function secrets.
-- This migration only creates a not-connected registry record; it does not
-- authenticate, import products, publish listings, or place supplier orders.

alter table public.supplier_connections
  drop constraint if exists supplier_connections_supplier_code_check;

alter table public.supplier_connections
  add constraint supplier_connections_supplier_code_check
  check (supplier_code = any (array[
    'syncee'::text,
    'dsers'::text,
    'cjdropshipping'::text,
    'printful'::text
  ]));

insert into public.supplier_connections (
  supplier_code,
  connection_status,
  integration_method,
  metadata
)
values (
  'printful',
  'not_connected',
  'direct_api',
  '{"connection_mode":"printful_api_and_shopify_app","credential_check_required":true}'::jsonb
)
on conflict (supplier_code) do nothing;
