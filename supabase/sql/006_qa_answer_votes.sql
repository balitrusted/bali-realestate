-- One upvote per visitor key per answer (IP-based; no auth required).

create table if not exists public.qa_answer_votes (
  answer_id text not null references public.qa_answers (id) on delete cascade,
  voter_key text not null,
  created_at timestamptz not null default now(),
  primary key (answer_id, voter_key)
);

create index if not exists idx_qa_answer_votes_voter_created
  on public.qa_answer_votes (voter_key, created_at desc);

grant select, insert, delete on table public.qa_answer_votes to service_role;
