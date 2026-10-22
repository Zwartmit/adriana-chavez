-- Datos de la cuenta para transferir el anticipo (21 oct 2026). Idempotente.
-- Texto libre (banco, tipo de cuenta, número, titular...) que Adriana registra desde el panel
-- (Pagos y anticipos) o por Telegram. El asistente de WhatsApp lo comparte con las clientas que
-- deben anticipo (etapa 2).
begin;

alter table public.configuracion_anticipos
  add column if not exists datos_transferencia text;
alter table public.configuracion_anticipos
  drop constraint if exists configuracion_anticipos_datos_largo;
alter table public.configuracion_anticipos
  add constraint configuracion_anticipos_datos_largo
  check (datos_transferencia is null or char_length(datos_transferencia) <= 1000);

comment on column public.configuracion_anticipos.datos_transferencia is 'Datos de la cuenta para transferir el anticipo (texto libre). Lo registra Adriana en el panel o por Telegram.';

commit;

-- ROLLBACK:
--   alter table public.configuracion_anticipos drop column if exists datos_transferencia;
