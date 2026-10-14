-- Seguimiento a conversaciones a la deriva (flujo n8n AC-Clientes-Seguimiento)
-- Una clienta que deja de responder entre 1 y 3 horas, dentro del horario del salón y sin cita futura, puede recibir
-- UN mensaje de seguimiento (decide y redacta la IA, que puede decidir no escribir). Esta migración agrega:
--   1. mensajes_entrantes.numero_salon: el número del salón al que escribió la clienta (el seguimiento responde desde él).
--   2. seguimientos_conversacion: un registro por último mensaje evaluado, para no evaluar ni escribir dos veces.
-- Sin cambios en tablas existentes más allá de la columna nueva (nulable). Rollback al final.

begin;

alter table public.mensajes_entrantes
  add column if not exists numero_salon text;

comment on column public.mensajes_entrantes.numero_salon is
  'Número de WhatsApp del salón al que escribió la clienta. El seguimiento a conversaciones responde desde este mismo número.';

create table if not exists public.seguimientos_conversacion (
  id                  bigint generated always as identity primary key,
  telefono            text   not null,
  mensaje_entrante_id bigint not null references public.mensajes_entrantes(id) on delete cascade,
  decision            text   not null default 'pendiente'
                      check (decision in ('pendiente', 'enviado', 'omitido', 'error')),
  texto               text,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  constraint uq_seguimiento_mensaje unique (mensaje_entrante_id)
);

create index if not exists idx_seguimientos_telefono_creado
  on public.seguimientos_conversacion (telefono, creado_en desc);

comment on table public.seguimientos_conversacion is
  'Un registro por cada último mensaje de clienta evaluado por el flujo de seguimiento. pendiente = reclamado y en proceso (si queda así, falló el envío); enviado = se escribió a la clienta; omitido = la IA decidió no escribir. Se borra solo cuando se borra el mensaje de origen (limpieza de mensajes_entrantes a los 7 días).';

alter table public.seguimientos_conversacion enable row level security;
revoke all on public.seguimientos_conversacion from anon, authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (solo si hay que deshacer; no borra datos de otras tablas):
--   drop table if exists public.seguimientos_conversacion;
--   alter table public.mensajes_entrantes drop column if exists numero_salon;
-- ══════════════════════════════════════════════════════════════════
