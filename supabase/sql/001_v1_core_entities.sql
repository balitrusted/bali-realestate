-- v1 staged migration: high-write entities first.
-- Apply in Supabase SQL editor or via migration pipeline.

create extension if not exists pgcrypto;

create table if not exists public.search_query_logs (
  id text primary key,
  query text not null,
  source text not null,
  path text,
  property_id text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_search_query_logs_created_at
  on public.search_query_logs (created_at desc);
create index if not exists idx_search_query_logs_query
  on public.search_query_logs (query);
create index if not exists idx_search_query_logs_source_created_at
  on public.search_query_logs (source, created_at desc);

create table if not exists public.requests (
  id text primary key,
  request_type text not null,
  name text not null,
  email text not null,
  whatsapp text,
  preferred_contact text,
  property_type text,
  area text,
  bedrooms text,
  budget text,
  budget_period text,
  budget_currency text,
  duration text[] not null default '{}',
  message text,
  property_id text,
  property_title text,
  property_url text,
  desired_start date,
  status text not null default 'new',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requests_status_check check (status in ('new', 'in_progress', 'done'))
);

create index if not exists idx_requests_created_at
  on public.requests (created_at desc);
create index if not exists idx_requests_status_created_at
  on public.requests (status, created_at desc);
create index if not exists idx_requests_request_type_created_at
  on public.requests (request_type, created_at desc);

create table if not exists public.comments (
  id text primary key,
  article_id text not null,
  parent_id text references public.comments (id) on delete set null,
  author_name text not null,
  author_email text not null,
  author_website text,
  content text not null,
  approved boolean not null default false,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  user_votes jsonb not null default '{}'::jsonb
);

create index if not exists idx_comments_article_approved_created
  on public.comments (article_id, approved, created_at desc);
create index if not exists idx_comments_parent
  on public.comments (parent_id);
create index if not exists idx_comments_created_at
  on public.comments (created_at desc);

alter table public.comments
  add column if not exists moderation_status text not null default 'pending';
alter table public.comments
  add column if not exists user_votes jsonb not null default '{}'::jsonb;
alter table public.comments
  add constraint comments_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

create table if not exists public.comment_votes (
  comment_id text not null references public.comments (id) on delete cascade,
  voter_key text not null,
  vote_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, voter_key),
  constraint comment_votes_vote_type_check check (vote_type in ('up', 'down'))
);

create index if not exists idx_comment_votes_updated_at
  on public.comment_votes (updated_at desc);

create table if not exists public.notify_requests (
  id text primary key,
  property_id text not null,
  property_title text not null default '',
  name text not null,
  email text not null,
  date_from date,
  created_at timestamptz not null default now()
);

create index if not exists idx_notify_requests_created_at
  on public.notify_requests (created_at desc);
create index if not exists idx_notify_requests_property_created
  on public.notify_requests (property_id, created_at desc);

create table if not exists public.properties_catalog (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Data API access for server-side migration/runtime.
-- We keep anon/authenticated closed for now.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.search_query_logs to service_role;
grant select, insert, update, delete on table public.requests to service_role;
grant select, insert, update, delete on table public.comments to service_role;
grant select, insert, update, delete on table public.comment_votes to service_role;
grant select, insert, update, delete on table public.notify_requests to service_role;
grant select, insert, update, delete on table public.properties_catalog to service_role;
