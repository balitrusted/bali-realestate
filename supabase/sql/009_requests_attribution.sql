alter table public.requests
  add column if not exists attribution jsonb;
