-- Migración forward-only: conserva el horario validado como fecha con zona horaria.
alter table public.conversations add column if not exists scheduled_at timestamptz;
