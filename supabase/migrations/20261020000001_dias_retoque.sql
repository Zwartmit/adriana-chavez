-- Días de retoque (20 oct 2026). Idempotente: se puede ejecutar de nuevo sin romper nada.
-- Cada servicio y cada adicional puede indicar a los cuántos días se recomienda el retoque
-- (por ejemplo uñas 21, cejas y pestañas 15). Es opcional: vacío = sin retoque.
-- Lo leen el agente de WhatsApp (para responder "cada cuánto me retoco") y, más adelante,
-- el aviso a Adriana de las clientas a quienes ya les toca el retoque.
begin;

alter table public.servicios   add column if not exists dias_retoque integer;
alter table public.adicionales add column if not exists dias_retoque integer;

alter table public.servicios   drop constraint if exists servicios_dias_retoque_valido;
alter table public.servicios   add  constraint servicios_dias_retoque_valido
  check (dias_retoque is null or (dias_retoque between 1 and 365));

alter table public.adicionales drop constraint if exists adicionales_dias_retoque_valido;
alter table public.adicionales add  constraint adicionales_dias_retoque_valido
  check (dias_retoque is null or (dias_retoque between 1 and 365));

commit;
