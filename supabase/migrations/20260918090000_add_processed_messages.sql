-- Migración forward-only: evita procesar más de una vez los reintentos de Evolution API.
create table if not exists public.processed_messages (
  message_id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.processed_messages enable row level security;
