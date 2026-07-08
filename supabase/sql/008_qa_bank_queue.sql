-- Tracks question-bank proposals: skipped or accepted (linked to qa_questions).
create table if not exists public.qa_bank_queue (
  bank_key text primary key,
  status text not null check (status in ('skipped', 'accepted')),
  question_id text,
  updated_at timestamptz not null default now()
);

create index if not exists qa_bank_queue_status_idx on public.qa_bank_queue (status);

grant select, insert, update, delete on table public.qa_bank_queue to service_role;
