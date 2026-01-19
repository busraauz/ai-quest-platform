-- =========================
-- seed.sql  (Similarity feature)
-- =========================

-- (optional) pgcrypto for UUID default if not already enabled
create extension if not exists "pgcrypto";

-- -------------------------
-- question_seeds
-- -------------------------
create table if not exists public.question_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null references public.sessions(id) on delete cascade,

  -- user provides either text or image
  input_mode text not null check (input_mode in ('text','image')),

  seed_text text,
  seed_image_path text,     -- Supabase Storage path (bucket: question-seeds)
  seed_image_mime text,
  seed_image_size int,

  extracted_text text,      -- if image, optional: vision-extracted question text
  analysis jsonb,           -- structured analysis output (topic, difficulty, style rules)

  created_at timestamptz not null default now()
);

create index if not exists idx_question_seeds_user_id
on public.question_seeds(user_id);

create index if not exists idx_question_seeds_session_id
on public.question_seeds(session_id);

create index if not exists idx_question_seeds_created_at
on public.question_seeds(created_at desc);

-- questions table in 001_document.sql already supports similarity (nullable document_id, source_type check).
