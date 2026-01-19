create table if not exists public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null,
  version int not null,
  instruction text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique(question_id, version)
);

create index if not exists idx_qv_question_id_version
on public.question_versions(question_id, version desc);