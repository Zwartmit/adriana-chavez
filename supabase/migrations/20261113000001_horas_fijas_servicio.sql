-- Horas fijas de inicio por servicio (13 nov 2026). REVISAR ANTES DE EJECUTAR.
-- Pedido de Adriana: algunos servicios solo se agendan a ciertas horas exactas
-- (p. ej. uñas: 8:00 am, 10:00 am, 2:00 pm y 5:00 pm), no en cualquier hora.
--
-- Diseño:
--   · Nueva columna servicios.horas_inicio (time[]). NULL = sin horas fijas.
--   · Es excluyente con la franja (inicio_desde / inicio_hasta): un servicio usa una u otra, nunca las dos.
--   · horario_violado() la valida; como el trigger de citas, horarios_libres(), el panel y las
--     herramientas de n8n ya llaman a esa función, todos heredan la regla sin más cambios.
--   · Una profesional con excepción de horario sigue exenta de todas las reglas (igual que antes).
--   · Las citas ya existentes no se tocan: solo se valida al crear o mover una cita.

begin;

alter table public.servicios
  add column if not exists horas_inicio time[];

alter table public.servicios
  drop constraint if exists chk_servicios_horas_inicio;
alter table public.servicios
  add constraint chk_servicios_horas_inicio check (
    horas_inicio is null
    or (
      cardinality(horas_inicio) between 1 and 12
      and inicio_desde is null
      and inicio_hasta is null
    )
  );

comment on column public.servicios.horas_inicio is
  'Si no es nulo, el servicio solo puede EMPEZAR exactamente a una de estas horas (hora de Colombia). Excluyente con inicio_desde/inicio_hasta.';

-- Función central (misma firma y mismas reglas de siempre + horas fijas).
create or replace function public.horario_violado(
  p_profesional uuid,
  p_servicio    uuid,
  p_inicio      timestamptz,
  p_fin         timestamptz
) returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cfg        public.configuracion_horario%rowtype;
  v_ini      timestamp := p_inicio at time zone 'America/Bogota';
  v_fin      timestamp := p_fin    at time zone 'America/Bogota';
  v_t_ini    time := date_trunc('minute', p_inicio at time zone 'America/Bogota')::time;
  v_t_fin    time := (p_fin    at time zone 'America/Bogota')::time;
  v_cruza    boolean := false;
  v_desde    time;
  v_hasta    time;
  v_horas    time[];
  v_lista    text;
  v_dia      smallint := extract(isodow from (p_inicio at time zone 'America/Bogota'))::smallint;
begin
  select * into cfg from public.configuracion_horario where id = 1;
  if not found then
    return null; -- sin configuración no se restringe nada
  end if;

  -- Exenta ese día completo (se mira el día en que EMPIEZA la cita)
  if p_profesional is not null and exists (
    select 1 from public.excepciones_horario e
    where e.profesional_id = p_profesional
      and v_ini::date between e.fecha_desde and e.fecha_hasta
  ) then
    return null;
  end if;

  select s.puede_cruzar_almuerzo, s.inicio_desde, s.inicio_hasta, s.horas_inicio
    into v_cruza, v_desde, v_hasta, v_horas
  from public.servicios s where s.id = p_servicio;
  v_cruza := coalesce(v_cruza, false);

  -- Día de atención
  if not (v_dia = any (cfg.dias_atencion)) then
    return 'El salón no atiende ese día';
  end if;

  -- Horario de apertura y cierre (y que no termine otro día)
  if v_t_ini < cfg.hora_apertura or v_fin::date <> v_ini::date or v_t_fin > cfg.hora_cierre then
    return 'Fuera del horario del salón ('
      || to_char(timestamp '2000-01-01' + cfg.hora_apertura, 'FMHH12:MI am') || ' a '
      || to_char(timestamp '2000-01-01' + cfg.hora_cierre,   'FMHH12:MI am') || ')';
  end if;

  -- Horas fijas de inicio del servicio (p. ej. uñas: 8, 10, 2 y 5)
  if v_horas is not null and cardinality(v_horas) > 0 and not (v_t_ini = any (v_horas)) then
    select string_agg(to_char(timestamp '2000-01-01' + h, 'FMHH12:MI am'), ', ' order by h)
      into v_lista
    from unnest(v_horas) as h;
    -- "8:00 am, 10:00 am, 2:00 pm y 5:00 pm"
    if position(', ' in v_lista) > 0 then
      v_lista := regexp_replace(v_lista, ', ([^,]*)$', ' y \1');
    end if;
    return 'Este servicio solo se agenda a las ' || v_lista;
  end if;

  -- Ventana de inicio del servicio (p. ej. Balayage)
  if v_desde is not null and (v_t_ini < v_desde or v_t_ini > v_hasta) then
    return 'Este servicio solo puede empezar entre '
      || to_char(timestamp '2000-01-01' + v_desde, 'FMHH12:MI am') || ' y '
      || to_char(timestamp '2000-01-01' + v_hasta, 'FMHH12:MI am');
  end if;

  -- Almuerzo
  if not v_cruza and v_t_ini < cfg.almuerzo_fin and v_t_fin > cfg.almuerzo_inicio then
    return 'Cruza la hora de almuerzo ('
      || to_char(timestamp '2000-01-01' + cfg.almuerzo_inicio, 'FMHH12:MI am') || ' a '
      || to_char(timestamp '2000-01-01' + cfg.almuerzo_fin,    'FMHH12:MI am') || ')';
  end if;

  return null;
end;
$$;
revoke execute on function public.horario_violado(uuid, uuid, timestamptz, timestamptz) from public, anon;
grant  execute on function public.horario_violado(uuid, uuid, timestamptz, timestamptz) to authenticated;

commit;

-- ──────────────────────────────────────────────────────────────────
-- PRUEBAS (ejecutar aparte, después de la migración). Cambia el UUID por un servicio real de uñas.
-- ──────────────────────────────────────────────────────────────────
-- update public.servicios set horas_inicio = '{08:00,10:00,14:00,17:00}' where nombre ilike '%uñas%';
-- select public.horario_violado(null, '<servicio>', '2026-11-16 10:00-05', '2026-11-16 11:00-05');  -- NULL (permitido)
-- select public.horario_violado(null, '<servicio>', '2026-11-16 11:00-05', '2026-11-16 12:00-05');  -- "Este servicio solo se agenda a las 8:00 am, 10:00 am, 2:00 pm y 5:00 pm"
-- update public.servicios set inicio_desde = '08:00', inicio_hasta = '08:30' where id = '<servicio>';   -- debe FALLAR (excluyente)
--
-- Reversa:
--   update public.servicios set horas_inicio = null;
--   (volver a crear horario_violado con 20261013000000_horarios_salon.sql, sección 4)
--   alter table public.servicios drop constraint if exists chk_servicios_horas_inicio, drop column if exists horas_inicio;
