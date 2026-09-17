create table if not exists public.conversations (
  contact text primary key,
  conversation jsonb not null,
  updated_at timestamptz not null default now()
);

-- La función de Vercel usa la service_role key; no habilites acceso anónimo a esta tabla.
alter table public.conversations enable row level security;
