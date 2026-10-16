-- Relevo con Adriana por Telegram (diseño del 15 oct 2026, doc bloque2-07)
-- Cuando la clienta necesita algo que solo Adriana puede resolver, el agente de WhatsApp abre una "escalación".
-- Adriana responde el aviso de Telegram y su texto llega a la clienta. Esta migración agrega solo la base de datos:
--   1. public.escalaciones: una solicitud por clienta mientras esté abierta o respondida.
--   2. avisos_admin.escalacion_id y avisos_admin.telegram_message_id: para saber a qué escalación pertenece el mensaje de
--      Telegram al que Adriana responde (cada aviso o recordatorio tiene su propio message_id, así que responder a
--      cualquiera de ellos funciona aunque haya varias solicitudes a la vez).
-- Estados:
--   abierta    = esperando a Adriana (aplican los recordatorios a Adriana y el aviso de espera a la clienta).
--   respondida = Adriana ya respondió; el agente de WhatsApp decide si quedó resuelto (no se le recuerda más a Adriana).
--   resuelta   = cerrada (por el agente, o sola si la clienta no vuelve a escribir en 24 h tras la respuesta).
--   vencida    = pasaron 23 h sin respuesta de Adriana; se avisó a la clienta y se cerró.
-- Las columnas *_en de recordatorios y avisos sirven para que cada mensaje automático se mande una sola vez.
-- Sin cambios en datos existentes. Rollback al final.

begin;

create table if not exists public.escalaciones (
  id                              bigint generated always as identity primary key,
  telefono                        text not null,
  cliente_id                      uuid references public.clientes(id) on delete set null,
  numero_salon                    text,
  motivo                          text not null,
  estado                          text not null default 'abierta'
                                  check (estado in ('abierta', 'respondida', 'resuelta', 'vencida')),
  creada_en                       timestamptz not null default now(),
  actualizada_en                  timestamptz not null default now(),
  cerrada_en                      timestamptz,
  ultima_respuesta_adriana        text,
  ultima_respuesta_en             timestamptz,
  recordatorios_adriana           smallint not null default 0,
  ultimo_recordatorio_en          timestamptz,
  espera_clienta_enviada_en       timestamptz,
  aviso_final_adriana_en          timestamptz,
  vencimiento_clienta_enviado_en  timestamptz,
  constraint ck_escalacion_cerrada check (
    (estado in ('resuelta', 'vencida')) = (cerrada_en is not null)
  )
);

-- Una sola solicitud viva por clienta: si vuelve a pedir ayuda, se actualiza la misma.
create unique index if not exists uq_escalacion_viva_por_telefono
  on public.escalaciones (telefono)
  where estado in ('abierta', 'respondida');

-- Para el flujo de recordatorios: buscar rápido las que esperan a Adriana.
create index if not exists idx_escalaciones_esperando
  on public.escalaciones (actualizada_en)
  where estado = 'abierta';

comment on table public.escalaciones is
  'Solicitudes de la clienta que solo Adriana puede resolver (relevo por Telegram). Una viva por teléfono. actualizada_en marca el último momento en que la clienta pidió ayuda (referencia para los plazos de 1 h, 20 h y 23 h).';
comment on column public.escalaciones.numero_salon is
  'Número de WhatsApp del salón al que escribió la clienta; la respuesta de Adriana sale desde este mismo número.';

alter table public.escalaciones enable row level security;
revoke all on public.escalaciones from anon, authenticated;

alter table public.avisos_admin
  add column if not exists escalacion_id bigint references public.escalaciones(id) on delete set null,
  add column if not exists telegram_message_id bigint;

create index if not exists idx_avisos_admin_telegram_message
  on public.avisos_admin (telegram_message_id)
  where telegram_message_id is not null;

comment on column public.avisos_admin.escalacion_id is
  'Escalación a la que pertenece el aviso o recordatorio (solo avisos del relevo con Adriana).';
comment on column public.avisos_admin.telegram_message_id is
  'id del mensaje de Telegram con el que se envió el aviso; el flujo de la cola lo guarda al enviar. Adriana responde ese mensaje.';

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (solo si hay que deshacer):
--   alter table public.avisos_admin drop column if exists telegram_message_id, drop column if exists escalacion_id;
--   drop table if exists public.escalaciones;
-- ══════════════════════════════════════════════════════════════════
