-- Metadatos de los adjuntos de una solicitud (sin copiar el archivo fuera de WhatsApp).
alter table public.conversations add column if not exists materials jsonb not null default '[]'::jsonb;
