create table if not exists public.conversations (
  contact text primary key,
  name text,
  need text,
  material text,
  materials jsonb not null default '[]'::jsonb,
  availability text,
  scheduled_at timestamptz,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  calendar_event_id text,
  conversation jsonb not null default '{"step":"contact","data":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hace que instalaciones creadas con una versión anterior ganen las columnas
-- estructuradas sin perder las conversaciones ya almacenadas.
alter table public.conversations add column if not exists name text;
alter table public.conversations add column if not exists need text;
alter table public.conversations add column if not exists material text;
alter table public.conversations add column if not exists materials jsonb not null default '[]'::jsonb;
alter table public.conversations add column if not exists availability text;
alter table public.conversations add column if not exists scheduled_at timestamptz;
alter table public.conversations add column if not exists confirmed boolean not null default false;
alter table public.conversations add column if not exists confirmed_at timestamptz;
alter table public.conversations add column if not exists created_at timestamptz not null default now();
alter table public.conversations add column if not exists calendar_event_id text;

create table if not exists public.processed_messages (
  message_id text primary key,
  processed_at timestamptz not null default now()
);

-- La función de Vercel usa la service_role key; no habilites acceso anónimo a esta tabla.
alter table public.conversations enable row level security;
alter table public.processed_messages enable row level security;

create table if not exists public.webhook_errors (
  id bigint generated always as identity primary key, source text not null, message text not null, message_id text, created_at timestamptz not null default now()
);
create table if not exists public.request_backups (
  id bigint generated always as identity primary key, snapshot jsonb not null, created_at timestamptz not null default now()
);
alter table public.webhook_errors enable row level security;
alter table public.request_backups enable row level security;
