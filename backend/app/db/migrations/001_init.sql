-- ============================================================
-- QuestAI Platform
-- Includes: document flow + refinement + similarity seeds
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists vector;

-- ============================================================
-- sessions
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,

  source_type text not null default 'document'
    check (source_type in ('document','similarity')),

  question_type text not null default 'mcq'
    check (question_type in ('mcq','open')),

  quantity int not null default 10,

  difficulty text
    check (difficulty is null or difficulty in ('easy','medium','hard')),

  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx
on public.sessions(user_id);

create index if not exists sessions_created_at_idx
on public.sessions(created_at desc);

create index if not exists sessions_source_type_idx
on public.sessions(source_type);

-- ============================================================
-- documents (PDF uploads for document-based generation)
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null references public.sessions(id) on delete cascade,

  filename text not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',

  extracted_text text,

  status text not null default 'ready'
    check (status in ('uploaded','processing','ready','failed')),

  error_message text,

  created_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx
on public.documents(user_id);

create index if not exists documents_session_id_idx
on public.documents(session_id);

create index if not exists documents_created_at_idx
on public.documents(created_at desc);

-- ============================================================
-- doc_chunks (RAG chunks + pgvector embeddings)
-- ============================================================
create table if not exists public.doc_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null references public.sessions(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,

  chunk_index int not null,
  content text not null,

  embedding vector(1536),

  created_at timestamptz not null default now(),

  unique(document_id, chunk_index)
);

create index if not exists doc_chunks_user_id_idx
on public.doc_chunks(user_id);

create index if not exists doc_chunks_document_id_idx
on public.doc_chunks(document_id);

-- ivfflat index (partial to avoid NULL bloat)
create index if not exists doc_chunks_embedding_ivfflat_idx
on public.doc_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100)
where embedding is not null;

-- ============================================================
-- questions (stores generated questions for both flows)
-- ============================================================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null references public.sessions(id) on delete cascade,

  -- nullable because similarity flow has no PDF/document
  document_id uuid references public.documents(id) on delete set null,

  source_type text not null default 'document'
    check (source_type in ('document','similarity')),

  question_type text not null
    check (question_type in ('mcq','open')),

  question_text text not null,
  options jsonb,                -- for mcq: {"A": "...", "B": "...", ...}
  correct_answer text not null default '', -- mcq: "A"/"B"/"C"/"D"; open: short answer
  explanation text not null,

  tags jsonb,
  confidence_score double precision,

  created_at timestamptz not null default now()
);

create index if not exists questions_user_id_idx
on public.questions(user_id);

create index if not exists questions_session_id_idx
on public.questions(session_id);

create index if not exists questions_document_id_idx
on public.questions(document_id);

create index if not exists questions_created_at_idx
on public.questions(created_at desc);

create index if not exists questions_source_type_idx
on public.questions(source_type);

create index if not exists questions_question_type_idx
on public.questions(question_type);

-- ============================================================
-- question_versions (Canvas refinement history)
-- ============================================================
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

-- ============================================================
-- question_seeds (Similarity input: text/image + analysis)
-- ============================================================
create table if not exists public.question_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null references public.sessions(id) on delete cascade,

  input_mode text not null check (input_mode in ('text','image')),

  seed_text text,
  seed_image_path text,     -- Supabase Storage path
  seed_image_mime text,
  seed_image_size int,

  extracted_text text,     
  analysis jsonb,          

  created_at timestamptz not null default now()
);

create index if not exists idx_question_seeds_user_id
on public.question_seeds(user_id);

create index if not exists idx_question_seeds_session_id
on public.question_seeds(session_id);

create index if not exists idx_question_seeds_created_at
on public.question_seeds(created_at desc);

-- ============================================================
-- RPC: vector search in doc_chunks
-- ============================================================
create or replace function public.match_doc_chunks(
  p_user_id uuid,
  p_document_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 6
)
returns table (
  id uuid,
  content text,
  chunk_index int,
  similarity double precision
)
language sql
stable
as $$
  select
    c.id,
    c.content,
    c.chunk_index,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.doc_chunks c
  where c.user_id = p_user_id
    and c.document_id = p_document_id
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;