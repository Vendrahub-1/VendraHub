create table if not exists public.social_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  platform_code text not null,
  account_label text not null,
  external_account_id text,
  connection_status text not null default 'not_connected' check (connection_status in ('not_connected','pending_authorization','connected','reauthorization_required','disabled')),
  publishing_capability text not null default 'unsupported' check (publishing_capability in ('supported','limited','unsupported')),
  account_metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_code, external_account_id)
);
create table if not exists public.social_content_posts (
  id uuid primary key default gen_random_uuid(),
  platform_code text not null,
  social_account_id uuid references public.social_platform_accounts(id) on delete set null,
  campaign_key text,
  content_type text not null default 'post' check (content_type in ('post','image','carousel','short_video','video','story','article','message')),
  title text,
  caption text not null,
  media_urls jsonb not null default '[]'::jsonb,
  destination_url text,
  scheduled_at timestamptz,
  posting_day date,
  timezone text not null default 'Africa/Lagos',
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','scheduled','published','failed','cancelled')),
  approval_required boolean not null default true,
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  external_post_id text,
  published_at timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_post_approval_state check (status not in ('approved','scheduled','published') or (approved_by is not null and approved_at is not null)),
  constraint social_post_schedule_state check (status <> 'scheduled' or scheduled_at is not null)
);
create unique index if not exists social_content_posts_one_per_platform_day on public.social_content_posts(platform_code, posting_day) where posting_day is not null and status not in ('rejected','cancelled','failed');
create index if not exists social_content_posts_queue_idx on public.social_content_posts(status, scheduled_at);
create table if not exists public.social_post_approval_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_content_posts(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected','reopened')),
  reviewer_id uuid not null,
  reviewer_note text,
  created_at timestamptz not null default now()
);
create table if not exists public.product_discovery_searches (
  id uuid primary key default gen_random_uuid(),
  search_query text not null,
  supplier_codes text[] not null default '{}',
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null default 0 check (result_count >= 0),
  created_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.product_discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references public.product_discovery_searches(id) on delete set null,
  supplier_code text not null,
  external_product_id text not null,
  product_snapshot jsonb not null,
  landed_cost numeric(14,2),
  landed_cost_currency text,
  suggested_retail_price numeric(14,2),
  suggested_retail_currency text,
  estimated_margin_percent numeric(7,3),
  review_status text not null default 'pending' check (review_status in ('pending','shortlisted','rejected','approved_for_import','imported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_code, external_product_id)
);
alter table public.social_platform_accounts enable row level security;
alter table public.social_content_posts enable row level security;
alter table public.social_post_approval_events enable row level security;
alter table public.product_discovery_searches enable row level security;
alter table public.product_discovery_candidates enable row level security;
create policy social_platform_accounts_admin_only on public.social_platform_accounts for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy social_content_posts_admin_only on public.social_content_posts for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy social_post_approval_events_admin_only on public.social_post_approval_events for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_discovery_searches_admin_only on public.product_discovery_searches for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_discovery_candidates_admin_only on public.product_discovery_candidates for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
comment on table public.social_content_posts is 'AI-prepared channel-specific content. Publishing requires explicit owner approval.';
comment on table public.social_post_approval_events is 'Audit trail of owner decisions on social content.';
comment on table public.product_discovery_candidates is 'Supplier product candidates retained for analysis and explicit review before import.';
