-- "Agendar igual": cita fuera de las reglas de horario, solo administradoras (13 nov 2026). REVISAR ANTES DE EJECUTAR.
-- Pedido de Adriana (punto 2): poder escribir la hora a mano, como en Google Calendar. Si la hora rompe una regla
-- del salón (fuera de horario, almuerzo, día sin atención, franja u horas fijas del servicio), el panel muestra el
-- motivo y deja "Agendar igual".
--
-- Diseño:
--   · crear_cita_con_adicionales() recibe p_forzar (por defecto false, así que todas las llamadas existentes,
--     incluidas las del agente de WhatsApp, siguen igual).
--   · Con p_forzar = true solo se salta la REGLA DE HORARIO. Si la hora choca con otra cita de la profesional o
--     con un bloqueo, se rechaza igual (el trigger de citas lo valida siempre).
--   · Solo funciona para una administradora del panel (es_admin()) o desde n8n/servidor (sin auth.uid(),
--     para la aprobación del punto 3). Una profesional o una persona sin permiso recibe error.
--   · Queda registrado en la cita: citas.horario_forzado (el motivo que se saltó) y horario_forzado_por.
--   · Se usa la misma variable de sesión que ya usa alargar_cita() (app.omitir_horario), limitada a esta
--     transacción y reiniciada aunque falle la inserción.
--   · Si la hora SÍ cumple las reglas, p_forzar no hace nada y no se registra nada.

begin;

alter table public.citas
  add column if not exists horario_forzado     text,
  add column if not exists horario_forzado_por uuid;

comment on column public.citas.horario_forzado is
  'Si no es nulo, la cita se agendó a propósito fuera de las reglas de horario y este es el motivo que se saltó.';
comment on column public.citas.horario_forzado_por is
  'Administradora que agendó la cita fuera de horario (nulo si lo hizo el sistema, por ejemplo al aprobar una solicitud).';

-- Se reemplaza la función (nueva firma con p_forzar al final; las llamadas posicionales de 9 argumentos siguen válidas).
drop function if exists public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text);

create or replace function public.crear_cita_con_adicionales(
  p_cliente        uuid,
  p_profesional    uuid,
  p_servicio       uuid,
  p_inicio         timestamptz,
  p_duracion_base  integer default null,
  p_adicionales    uuid[]  default '{}',
  p_canal          text    default 'presencial',
  p_estado         text    default 'pendiente',
  p_notas_cliente  text    default null,
  p_forzar         boolean default false
) returns table (
  cita_id             uuid,
  inicio_local        text,
  fin_local           text,
  estado              text,
  duracion_total_min  integer,
  adicionales         text,
  precio_desde_total  numeric,
  precio_hasta_total  numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids       uuid[];
  v_validos   integer;
  v_base      integer;
  v_extra     integer;
  v_total     integer;
  v_cita      uuid;
  v_inicio    timestamptz;
  v_srv       numeric;
  v_srv_hasta numeric;
  v_nombres   text;
  v_motivo    text;
begin
  -- Un usuario autenticado del panel debe ser staff; n8n se conecta como postgres (sin auth.uid()).
  if auth.uid() is not null and not public.es_staff() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if coalesce(p_forzar, false) and auth.uid() is not null and not public.es_admin() then
    raise exception 'Solo una administradora puede agendar fuera de las reglas de horario' using errcode = '42501';
  end if;
  if p_estado not in ('pendiente', 'confirmada') then
    raise exception 'Estado de cita no permitido' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct x), '{}'::uuid[]) into v_ids
  from unnest(coalesce(p_adicionales, '{}'::uuid[])) as x;

  select count(*), coalesce(sum(v.duracion_min), 0), string_agg(v.nombre, ', ' order by v.nombre)
    into v_validos, v_extra, v_nombres
  from public.adicionales_validos(p_servicio, v_ids) v;

  if v_validos <> cardinality(v_ids) then
    raise exception 'Adicional no válido para este servicio' using errcode = '22023';
  end if;

  select s.duracion_min, s.precio, s.precio_hasta
    into v_base, v_srv, v_srv_hasta
  from public.servicios s where s.id = p_servicio;
  v_base  := coalesce(v_base, p_duracion_base, 60);
  v_total := v_base + v_extra;

  -- Solo si se pidió forzar Y la hora de verdad rompe una regla se salta la validación de horario.
  if coalesce(p_forzar, false) then
    v_motivo := public.horario_violado(p_profesional, p_servicio, p_inicio, p_inicio + make_interval(mins => v_total));
    if v_motivo is not null then
      perform set_config('app.omitir_horario', 'si', true);
    end if;
  end if;

  begin
    insert into public.citas (
      cliente_id, profesional_id, servicio_id, fecha_hora, duracion_min,
      estado, canal_origen, notas_cliente,
      recordatorio_24h_enviado, recordatorio_2h_enviado, seguimiento_enviado
    ) values (
      p_cliente, p_profesional, p_servicio, p_inicio, v_total,
      p_estado, p_canal, nullif(btrim(coalesce(p_notas_cliente, '')), ''),
      false, false, false
    ) returning id, fecha_hora into v_cita, v_inicio;
  exception when others then
    perform set_config('app.omitir_horario', '', true);
    raise;
  end;
  perform set_config('app.omitir_horario', '', true);

  if v_motivo is not null then
    update public.citas
       set horario_forzado = v_motivo,
           horario_forzado_por = auth.uid()
     where id = v_cita;
  end if;

  insert into public.cita_adicionales (cita_id, adicional_id, nombre, precio, precio_hasta, duracion_min)
  select v_cita, v.id, v.nombre, v.precio, v.precio_hasta, v.duracion_min
  from public.adicionales_validos(p_servicio, v_ids) v;

  if p_canal = 'whatsapp' then
    insert into public.avisos_admin (tipo, cita_id, mensaje)
    select 'cita_nueva', v_cita,
           'Cita nueva por WhatsApp: ' || coalesce(cl.nombre, 'sin nombre registrado')
             || ' (' || coalesce(cl.telefono, 'sin teléfono') || '). '
             || coalesce(s.nombre, 'Servicio sin nombre')
             || coalesce(' (adicionales: ' || v_nombres || ')', '')
             || ' con ' || coalesce(p.nombre, 'profesional sin nombre')
             || ', ' || public.formato_cita_aviso(v_inicio, v_total) || '.'
    from public.clientes cl
    left join public.servicios s on s.id = p_servicio
    left join public.profesionales p on p.id = p_profesional
    where cl.id = p_cliente;
  end if;

  return query
  select v_cita,
         to_char(v_inicio at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'),
         to_char((v_inicio + make_interval(mins => v_total)) at time zone 'America/Bogota', 'HH24:MI'),
         p_estado,
         v_total,
         v_nombres,
         coalesce(v_srv, 0) + coalesce((select sum(precio) from public.cita_adicionales where cita_adicionales.cita_id = v_cita), 0),
         coalesce(v_srv_hasta, v_srv, 0)
           + coalesce((select sum(coalesce(precio_hasta, precio)) from public.cita_adicionales where cita_adicionales.cita_id = v_cita), 0);
end;
$$;

revoke execute on function public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text, boolean) from public, anon;
grant  execute on function public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text, boolean) to authenticated;

commit;

-- ──────────────────────────────────────────────────────────────────
-- Reversa (solo si hay que deshacer):
--   drop function if exists public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text, boolean);
--   y volver a crear la función con la definición de 20261017000001_adicionales.sql (sección 5), con su revoke/grant.
--   alter table public.citas drop column if exists horario_forzado, drop column if exists horario_forzado_por;
