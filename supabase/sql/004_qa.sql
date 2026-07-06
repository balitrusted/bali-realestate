-- Q&A community: questions, answers, optional votes (phase 1).
-- Virtual authors: display name only on row (author_kind = 'virtual'), no auth user.

create table if not exists public.qa_questions (
  id text primary key,
  slug text not null unique,
  title text not null,
  body text,
  category text not null,
  status text not null default 'draft',
  author_kind text not null default 'virtual',
  author_display_name text not null,
  author_user_id text,
  is_seeded boolean not null default false,
  answer_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  seo_title text,
  seo_description text,
  related_service_id text,
  related_area text,
  constraint qa_questions_status_check check (status in ('draft', 'published', 'closed')),
  constraint qa_questions_author_kind_check check (author_kind in ('virtual', 'member', 'official')),
  constraint qa_questions_category_check check (category in ('rent', 'buy', 'services', 'living'))
);

create index if not exists idx_qa_questions_status_published
  on public.qa_questions (status, published_at desc nulls last);
create index if not exists idx_qa_questions_category_published
  on public.qa_questions (category, status, published_at desc nulls last);
create index if not exists idx_qa_questions_slug
  on public.qa_questions (slug);

create table if not exists public.qa_answers (
  id text primary key,
  question_id text not null references public.qa_questions (id) on delete cascade,
  parent_id text references public.qa_answers (id) on delete set null,
  author_kind text not null default 'official',
  author_display_name text not null,
  author_user_id text,
  is_official boolean not null default false,
  content text not null,
  status text not null default 'approved',
  upvotes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint qa_answers_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint qa_answers_author_kind_check check (author_kind in ('virtual', 'member', 'official'))
);

create index if not exists idx_qa_answers_question_created
  on public.qa_answers (question_id, status, created_at asc);
create index if not exists idx_qa_answers_parent
  on public.qa_answers (parent_id);

grant select, insert, update, delete on table public.qa_questions to service_role;
grant select, insert, update, delete on table public.qa_answers to service_role;
