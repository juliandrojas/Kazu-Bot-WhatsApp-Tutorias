alter table public.conversations add column if not exists calendar_event_id text;

create table if not exists public.webhook_errors (
  id bigint generated always as identity primary key,
  source text not null,
  message text not null,
  message_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.request_backups (
  id bigint generated always as identity primary key,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.webhook_errors enable row level security;
alter table public.request_backups enable row level security;
