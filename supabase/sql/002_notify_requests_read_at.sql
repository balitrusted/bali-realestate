-- Per-request read state for admin notify badge (replaces fragile cookie-only seen time).
alter table public.notify_requests
  add column if not exists read_at timestamptz;

create index if not exists idx_notify_requests_unread
  on public.notify_requests (created_at desc)
  where read_at is null;
