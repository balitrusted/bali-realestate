-- Property change history (append-only audit log).

create table if not exists public.property_events (
  id text primary key,
  property_id text not null,
  event_type text not null,
  comment text,
  changed_fields jsonb,
  created_at timestamptz not null default now(),
  constraint property_events_event_type_check check (
    event_type in ('created', 'updated', 'archived', 'restored', 'deleted')
  )
);

create index if not exists idx_property_events_property_created
  on public.property_events (property_id, created_at desc);

create index if not exists idx_property_events_created_at
  on public.property_events (created_at desc);

grant select, insert, update, delete on table public.property_events to service_role;
