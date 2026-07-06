-- Guest submissions: store email for moderation only (not shown publicly).

alter table public.qa_questions
  add column if not exists author_email text;
