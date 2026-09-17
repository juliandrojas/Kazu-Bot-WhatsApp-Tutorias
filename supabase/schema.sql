create table if not exists public.conversations (
  contact text primary key,
  name text,
  need text,
  material text,
  availability text,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  conversation jsonb not null default '{"step":"contact","data":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hace que instalaciones creadas con una versión anterior ganen las columnas
-- estructuradas sin perder las conversaciones ya almacenadas.
alter table public.conversations add column if not exists name text;
alter table public.conversations add column if not exists need text;
alter table public.conversations add column if not exists material text;
alter table public.conversations add column if not exists availability text;
alter table public.conversations add column if not exists confirmed boolean not null default false;
alter table public.conversations add column if not exists confirmed_at timestamptz;
alter table public.conversations add column if not exists created_at timestamptz not null default now();

-- La función de Vercel usa la service_role key; no habilites acceso anónimo a esta tabla.
alter table public.conversations enable row level security;
