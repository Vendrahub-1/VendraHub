-- VendraHub AI approval queue. Decisions are recorded separately from execution.
create table if not exists public.ai_approval_requests (
 id uuid primary key default gen_random_uuid(),
 action_type text not null check (action_type in ('product_update','product_publish','order_fulfilment','order_cancellation','refund','inventory_adjustment','supplier_order','customer_account_change','support_reply','store_setting_change')),
 resource_type text,
 resource_id text,
 summary text not null check (char_length(summary) between 8 and 500),
 proposed_payload jsonb not null default '{}'::jsonb,
 risk_level text not null check (risk_level in ('low','medium','high','critical')),
 status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
 requested_by uuid not null references auth.users(id) on delete restrict,
 reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz,
 review_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ai_approval_resource_type_length check (resource_type is null or char_length(resource_type)<=80),
 constraint ai_approval_resource_id_length check (resource_id is null or char_length(resource_id)<=255),
 constraint ai_approval_review_note_length check (review_note is null or char_length(review_note)<=1000)
);
create index if not exists ai_approval_status_created_idx on public.ai_approval_requests(status,created_at desc);
create index if not exists ai_approval_requester_created_idx on public.ai_approval_requests(requested_by,created_at desc);
alter table public.ai_approval_requests enable row level security;
create policy "ai_approval_owner_select" on public.ai_approval_requests for select to authenticated
 using (lower((select auth.jwt()->>'email'))='vendrahub@hotmail.com' and (select auth.jwt()->>'aal')='aal2');
create policy "ai_approval_owner_insert" on public.ai_approval_requests for insert to authenticated
 with check (requested_by=(select auth.uid()) and lower((select auth.jwt()->>'email'))='vendrahub@hotmail.com' and (select auth.jwt()->>'aal')='aal2');
create policy "ai_approval_owner_update" on public.ai_approval_requests for update to authenticated
 using (lower((select auth.jwt()->>'email'))='vendrahub@hotmail.com' and (select auth.jwt()->>'aal')='aal2')
 with check (lower((select auth.jwt()->>'email'))='vendrahub@hotmail.com' and (select auth.jwt()->>'aal')='aal2');
grant select,insert,update on public.ai_approval_requests to authenticated;
