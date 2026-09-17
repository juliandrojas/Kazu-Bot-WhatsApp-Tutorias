-- Migración forward-only para proyectos que ya tienen la tabla conversations.
-- No elimina ni transforma la columna conversation existente.
alter table public.conversations add column if not exists name text;
alter table public.conversations add column if not exists need text;
alter table public.conversations add column if not exists material text;
alter table public.conversations add column if not exists availability text;
alter table public.conversations add column if not exists confirmed boolean not null default false;
alter table public.conversations add column if not exists confirmed_at timestamptz;
alter table public.conversations add column if not exists created_at timestamptz not null default now();
