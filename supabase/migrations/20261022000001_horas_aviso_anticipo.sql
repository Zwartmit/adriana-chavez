-- Plazo de aviso configurable (22 oct 2026). Idempotente.
-- Antes el plazo para cancelar o mover una cita con anticipo era fijo (24 horas). Ahora lo define Adriana
-- en el panel (Pagos y anticipos) o por Telegram: configuracion_anticipos.horas_aviso (24 por defecto).
-- Con ese aviso o más: cancelar pasa el anticipo a saldo a favor y mover lo conserva. Con menos: se pierde.
begin;

alter table public.configuracion_anticipos
  add column if not exists horas_aviso smallint not null default 24;
alter table public.configuracion_anticipos
  drop constraint if exists configuracion_anticipos_horas_aviso_valido;
alter table public.configuracion_anticipos
  add constraint configuracion_anticipos_horas_aviso_valido check (horas_aviso between 1 and 168);
comment on column public.configuracion_anticipos.horas_aviso is 'Horas de aviso para cancelar o mover una cita con anticipo: con ese aviso o más el anticipo pasa a saldo (cancelar) o se conserva (mover); con menos se pierde.';

create or replace function public.horas_aviso_anticipo()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select c.horas_aviso from public.configuracion_anticipos c where c.id = 1), 24)::integer;
$$;
revoke execute on function public.horas_aviso_anticipo() from public, anon;
grant  execute on function public.horas_aviso_anticipo() to authenticated;

create or replace function public.acreditar_anticipo_cita(p_cita_id uuid, p_forzar boolean default false)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_id bigint;
begin
  if auth.uid() is not null and not public.es_staff() then
    raise exception 'No autorizado';
  end if;

  select ci.id, ci.cliente_id, ci.estado, ci.fecha_hora, ci.anticipo_monto, ci.anticipo_recibido_en
    into c from public.citas ci where ci.id = p_cita_id;
  if c.id is null or c.estado <> 'cancelada' or c.anticipo_recibido_en is null or coalesce(c.anticipo_monto, 0) <= 0 then
    return 0;
  end if;
  if not p_forzar and c.fecha_hora < now() + make_interval(hours => public.horas_aviso_anticipo()) then
    return 0;
  end if;

  insert into public.movimientos_saldo (cliente_id, tipo, monto, cita_id, nota)
  values (c.cliente_id, 'anticipo_cancelacion', c.anticipo_monto, c.id,
          case when p_forzar then 'Anticipo de cita cancelada (acreditado por el salón)'
               else 'Anticipo de cita cancelada con ' || public.horas_aviso_anticipo() || ' horas o más de aviso' end)
  on conflict do nothing
  returning id into v_id;

  return case when v_id is null then 0 else c.anticipo_monto end;
end;
$$;
revoke execute on function public.acreditar_anticipo_cita(uuid, boolean) from public, anon;
grant  execute on function public.acreditar_anticipo_cita(uuid, boolean) to authenticated;

commit;

-- ROLLBACK:
--   (restaurar acreditar_anticipo_cita de 20261022000000 con interval '24 hours')
--   drop function if exists public.horas_aviso_anticipo();
--   alter table public.configuracion_anticipos drop column if exists horas_aviso;
