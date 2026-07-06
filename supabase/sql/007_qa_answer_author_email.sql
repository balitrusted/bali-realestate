-- Guest community answers: email for moderation only.

alter table public.qa_answers
  add column if not exists author_email text;
