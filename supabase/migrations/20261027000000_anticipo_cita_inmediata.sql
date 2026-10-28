-- Anticipo con cita inmediata + valoración sin anticipo (27 oct 2026). Idempotente.
--
-- Cambio de regla pedido por Brandon (26 oct): Adriana casi nunca alcanza a revisar los pagos, así que la cita
-- ya no espera su "Recibido". Ahora:
--   1. La clienta pide un horario y el agente le aparta el horario unas horas y le pide el anticipo (igual que antes).
--   2. Cuando la clienta envía el comprobante (avisar_pago_anticipo), la cita se AGENDA en ese momento
--      (estado "pendiente", con la nota interna "Anticipo por validar") y Adriana recibe el aviso con los botones
--      Recibido / No recibido.
--   3. Recibido: la cita queda "confirmada" con el anticipo registrado y se le escribe a la clienta si su ventana de
--      24 horas sigue abierta (si no, no se le envía nada; el mensaje a Adriana trae el enlace de WhatsApp).
--      No recibido: se cancela la cita, se libera el horario y se le avisa a la clienta (misma regla de la ventana).
--   4. Adriana puede validar cuando pueda: recordatorio_pagos_pendientes() reenvía los pagos por validar con sus
--      botones (lo llama un disparador de AC-Admin-Avisos a las horas que se configuren). Sin respuesta, la
--      solicitud se cierra sola 7 días después de la cita (la cita se queda como estaba).
--   5. Servicios con sin_anticipo = true (la Valoración) se agendan directo, aunque la clienta sea nueva.
-- Compatibilidad: las solicitudes "por_confirmar" creadas antes de este cambio (sin cita) siguen funcionando como antes.
begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Servicios que no piden anticipo
-- ──────────────────────────────────────────────────────────────────
alter table public.servicios
  add column if not exists sin_anticipo boolean not null default false;
comment on column public.servicios.sin_anticipo is 'true = a este servicio no se le pide anticipo aunque la clienta sea nueva (se agenda directo). Ejemplo: la valoración.';

update public.servicios
   set sin_anticipo = true
 where translate(lower(btrim(nombre)), 'áéíóú', 'aeiou') = 'valoracion'
   and sin_anticipo = false;

-- ──────────────────────────────────────────────────────────────────
-- 2. Una sola solicitud "esperando_pago" por clienta; las que ya tienen cita por validar pueden ser varias
-- ──────────────────────────────────────────────────────────────────
drop index if exists public.uq_solicitud_anticipo_viva;
create unique index if not exists uq_solicitud_anticipo_esperando
  on public.solicitudes_anticipo (cliente_id)
  where estado = 'esperando_pago';

-- ──────────────────────────────────────────────────────────────────
-- 3. Candado de agendar_cita: ahora conoce el servicio (la valoración se agenda directo)
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.exigir_cita_sin_anticipo(uuid);
create or replace function public.exigir_cita_sin_anticipo(p_cliente uuid, p_servicio uuid default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_servicio is not null
     and exists (select 1 from public.servicios s where s.id = p_servicio and s.sin_anticipo) then
    return true;
  end if;
  if coalesce(public.requiere_anticipo(p_cliente), false) then
    raise exception 'Esta clienta debe pagar anticipo para agendar: usa solicitar_anticipo y no agendar_cita.' using errcode = 'P0001';
  end if;
  return true;
end;
$$;
revoke execute on function public.exigir_cita_sin_anticipo(uuid, uuid) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 4. Solicitar el anticipo (igual que antes, con dos cambios: el servicio sin anticipo se rechaza y solo se
--    reemplaza la solicitud que sigue esperando el pago)
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.solicitar_anticipo(text, uuid, uuid, timestamptz, integer, uuid[], text);
create function public.solicitar_anticipo(
  p_telefono      text,
  p_profesional   uuid,
  p_servicio      uuid,
  p_inicio        timestamptz,
  p_duracion_base integer default null,
  p_adicionales   uuid[]  default '{}',
  p_numero_salon  text    default null
) returns table (
  ok                   boolean,
  error                text,
  solicitud_id         bigint,
  monto                numeric,
  monto_texto          text,
  porcentaje           integer,
  total_desde_texto    text,
  horas                integer,
  vence_local          text,
  cita_local           text,
  servicio             text,
  profesional          text,
  datos_transferencia  text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente   uuid;
  v_nombre    text;
  v_ids       uuid[];
  v_validos   integer;
  v_extra     integer;
  v_base      integer;
  v_total     integer;
  v_srv       numeric;
  v_srv_nom   text;
  v_prof_nom  text;
  v_total_des numeric;
  v_pct       integer;
  v_horas     integer;
  v_datos     text;
  v_monto     numeric;
  v_fin       timestamptz;
  v_vence     timestamptz;
  v_motivo    text;
  v_bloqueo   uuid;
  v_sol       bigint;
  v_old_bloq  uuid[];
  v_viejo     record;
  v_sin       boolean;
begin
  select c.id, coalesce(nullif(btrim(c.nombre), ''), 'sin nombre') into v_cliente, v_nombre
    from public.clientes c where c.telefono = p_telefono limit 1;
  if v_cliente is null then
    return query select false, 'No se encontró a la clienta: primero usa buscar_cliente o crear_cliente.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  if not coalesce(public.requiere_anticipo(v_cliente), false) then
    return query select false, 'A esta clienta no se le pide anticipo: agenda directo con agendar_cita.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  select cfg.porcentaje, cfg.horas_pago, nullif(btrim(cfg.datos_transferencia), '')
    into v_pct, v_horas, v_datos
    from public.configuracion_anticipos cfg where cfg.id = 1;
  v_pct   := coalesce(v_pct, 50);
  v_horas := coalesce(v_horas, 3);

  select coalesce(array_agg(distinct x), '{}'::uuid[]) into v_ids from unnest(coalesce(p_adicionales, '{}'::uuid[])) as x;
  select count(*), coalesce(sum(v.duracion_min), 0) into v_validos, v_extra from public.adicionales_validos(p_servicio, v_ids) v;
  if v_validos <> cardinality(v_ids) then
    return query select false, 'Adicional no válido para este servicio.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  select s.duracion_min, s.precio, s.nombre, s.sin_anticipo into v_base, v_srv, v_srv_nom, v_sin from public.servicios s where s.id = p_servicio;
  if v_srv_nom is null then
    return query select false, 'No se encontró el servicio.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;
  if coalesce(v_sin, false) then
    return query select false, 'Este servicio no lleva anticipo: agenda directo con agendar_cita (no uses solicitar_anticipo).', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;
  select p.nombre into v_prof_nom from public.profesionales p where p.id = p_profesional;
  if v_prof_nom is null then
    return query select false, 'No se encontró la profesional.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  v_base  := coalesce(v_base, p_duracion_base, 60);
  v_total := v_base + v_extra;
  v_fin   := p_inicio + make_interval(mins => v_total);
  v_total_des := coalesce(v_srv, 0) + coalesce((select sum(v.precio) from public.adicionales_validos(p_servicio, v_ids) v), 0);
  if v_total_des <= 0 then
    return query select false, 'Este servicio no tiene precio registrado: avisa a Adriana para que defina el anticipo.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;
  v_monto := round(v_total_des * v_pct / 100.0);
  if v_monto <= 0 then v_monto := 1; end if;

  if p_inicio < now() + interval '30 minutes' then
    return query select false, 'Ese horario empieza en menos de 30 minutos: debe coordinarlo directamente con Adriana (usa avisar_adriana).', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_profesional::text));

  -- Bloqueos de una solicitud viva anterior de la misma clienta (se reemplaza al final si todo es válido).
  select coalesce(array_agg(x.bloqueo_id), '{}'::uuid[]) into v_old_bloq
    from public.solicitudes_anticipo x
   where x.cliente_id = v_cliente and x.estado = 'esperando_pago' and x.bloqueo_id is not null;

  if exists (
    select 1 from public.citas c
     where c.profesional_id = p_profesional
       and c.estado not in ('cancelada', 'no_asistio')
       and p_inicio < c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60))
       and v_fin > c.fecha_hora
  ) then
    return query select false, 'La profesional ya tiene una cita en ese horario.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;
  if exists (
    select 1 from public.bloqueos_horario b
     where (b.profesional_id = p_profesional or b.profesional_id is null)
       and b.id <> all (v_old_bloq)
       and p_inicio < b.fecha_fin and v_fin > b.fecha_inicio
  ) then
    return query select false, 'La profesional tiene un bloqueo en ese horario.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;
  v_motivo := public.horario_violado(p_profesional, p_servicio, p_inicio, v_fin);
  if v_motivo is not null then
    return query select false, 'Horario no permitido: ' || v_motivo, null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  v_vence := least(now() + make_interval(hours => v_horas), p_inicio);

  -- Todo es válido: se cancela la solicitud anterior que seguía esperando el pago (si había) y se libera su horario.
  for v_viejo in
    select x.id, x.bloqueo_id from public.solicitudes_anticipo x
     where x.cliente_id = v_cliente and x.estado = 'esperando_pago'
  loop
    delete from public.bloqueos_horario where id = v_viejo.bloqueo_id;
    update public.solicitudes_anticipo set estado = 'cancelada', resuelta_en = now(), bloqueo_id = null where id = v_viejo.id;
  end loop;

  insert into public.bloqueos_horario (profesional_id, fecha_inicio, fecha_fin, motivo)
  values (p_profesional, p_inicio, v_fin, 'Anticipo pendiente: ' || v_nombre)
  returning id into v_bloqueo;

  insert into public.solicitudes_anticipo (
    cliente_id, telefono, numero_salon, profesional_id, servicio_id, inicio, duracion_base, duracion_total,
    adicional_ids, total_desde, monto, porcentaje, bloqueo_id, vence_en
  ) values (
    v_cliente, p_telefono, p_numero_salon, p_profesional, p_servicio, p_inicio, v_base, v_total,
    v_ids, v_total_des, v_monto, v_pct, v_bloqueo, v_vence
  ) returning id into v_sol;

  return query select true, null::text, v_sol, v_monto, public.formato_pesos(v_monto), v_pct,
    public.formato_pesos(v_total_des), v_horas,
    to_char(v_vence at time zone 'America/Bogota', 'FMHH12:MI am'),
    public.formato_cita_aviso(p_inicio, v_total), v_srv_nom, v_prof_nom, v_datos;
end;
$$;
revoke execute on function public.solicitar_anticipo(text, uuid, uuid, timestamptz, integer, uuid[], text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 5. La clienta dice que pagó / envió el comprobante: se agenda la cita y se avisa a Adriana para validar
--    Devuelve también los datos de la cita para que el agente se los diga a la clienta.
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.avisar_pago_anticipo(text, text);
create function public.avisar_pago_anticipo(p_telefono text, p_metodo text default 'transferencia')
returns table (
  ok          boolean,
  error       text,
  solicitud_id bigint,
  ya_avisada  boolean,
  cita_local  text,
  servicio    text,
  profesional text,
  metodo      text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s        record;
  v_metodo text := case when lower(coalesce(p_metodo, '')) like '%efectivo%' then 'efectivo' else 'transferencia' end;
  v_cita   uuid;
  v_serv   text;
  v_prof   text;
  v_cuando text;
  v_err    text;
begin
  select x.* into s
    from public.solicitudes_anticipo x
    join public.clientes c on c.id = x.cliente_id
   where c.telefono = p_telefono and x.estado = 'esperando_pago'
   limit 1;

  if s.id is null then
    -- ¿Ya había avisado un pago que Adriana está validando?
    select x.* into s
      from public.solicitudes_anticipo x
      join public.clientes c on c.id = x.cliente_id
     where c.telefono = p_telefono and x.estado = 'por_confirmar'
     order by x.comprobante_en desc nulls last, x.id desc
     limit 1;
    if s.id is not null then
      select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
      select p.nombre into v_prof from public.profesionales p where p.id = s.profesional_id;
      return query select true, null::text, s.id, true,
        public.formato_cita_aviso(coalesce((select ci.fecha_hora from public.citas ci where ci.id = s.cita_id), s.inicio),
                                  coalesce((select ci.duracion_min from public.citas ci where ci.id = s.cita_id), s.duracion_total)),
        v_serv, v_prof, s.metodo;
      return;
    end if;
    return query select false, 'La clienta no tiene una solicitud de anticipo vigente (puede haber vencido: vuelve a solicitarla con solicitar_anticipo si ella aún quiere la cita).', null::bigint, false, null::text, null::text, null::text, null::text;
    return;
  end if;

  select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
  select p.nombre into v_prof from public.profesionales p where p.id = s.profesional_id;
  v_cuando := public.formato_cita_aviso(s.inicio, s.duracion_total);

  if s.inicio <= now() then
    return query select false, 'El horario de esa cita ya pasó: no se pudo agendar. Dile a la clienta que Adriana la contacta y llama avisar_adriana.', s.id, false, null::text, null::text, null::text, null::text;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(s.profesional_id::text));

  -- La cita se crea ahora (pendiente de validar el pago). Si algo falla, el bloque se deshace y el horario sigue apartado.
  begin
    delete from public.bloqueos_horario where id = s.bloqueo_id;
    select r.cita_id into v_cita
      from public.crear_cita_con_adicionales(
             s.cliente_id, s.profesional_id, s.servicio_id, s.inicio, s.duracion_base,
             s.adicional_ids, 'whatsapp', 'pendiente', null) r;
    -- El aviso "cita nueva" sobra: el aviso del anticipo ya trae la cita (y nunca se envió, es la misma transacción).
    delete from public.avisos_admin where cita_id = v_cita and tipo = 'cita_nueva' and enviado_en is null;
    update public.citas
       set notas_internas = 'Anticipo por validar: ' || public.formato_pesos(s.monto) || ' (' || v_metodo || ')'
     where id = v_cita;
    update public.solicitudes_anticipo
       set estado = 'por_confirmar', metodo = v_metodo, comprobante_en = now(), cita_id = v_cita, bloqueo_id = null,
           vence_en = s.inicio + make_interval(mins => s.duracion_total) + interval '7 days'
     where id = s.id;
  exception when others then
    get stacked diagnostics v_err = message_text;
    return query select false, 'No se pudo agendar la cita (' || v_err || '). Dile a la clienta que Adriana la contacta y llama avisar_adriana.', s.id, false, null::text, null::text, null::text, null::text;
    return;
  end;

  insert into public.avisos_admin (tipo, mensaje, solicitud_anticipo_id)
  select 'anticipo',
         'Anticipo por confirmar: ' || coalesce(nullif(btrim(cl.nombre), ''), 'sin nombre registrado')
           || ' (' || s.telefono || ')'
           || chr(10) || 'Cita: ' || coalesce(v_serv, 'Servicio') || ' con ' || coalesce(v_prof, 'profesional')
           || ', ' || v_cuando || ' (ya quedó agendada, pendiente de que valides el pago)'
           || chr(10) || 'Anticipo: ' || public.formato_pesos(s.monto) || ' (' || s.porcentaje || ' % de ' || public.formato_pesos(s.total_desde) || ')'
           || chr(10) || case when v_metodo = 'efectivo'
                              then 'Forma de pago: efectivo (lo pagará en el salón: antes de la cita, al llegar o al terminar el servicio)'
                              else 'Forma de pago: transferencia' end
           || chr(10) || 'WhatsApp: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g')
           || chr(10) || chr(10) || case when v_metodo = 'efectivo'
                                       then 'Cuando tengas el efectivo, pulsa el botón Recibido (la cita queda confirmada). Si no lo paga, pulsa No recibido: se cancela la cita y se libera el horario.'
                                       else 'Cuando puedas, revisa que el pago haya llegado y pulsa el botón Recibido (la cita queda confirmada) o No recibido (se cancela la cita y se libera el horario).' end,
         s.id
    from public.clientes cl
   where cl.id = s.cliente_id;

  return query select true, null::text, s.id, false, v_cuando, v_serv, v_prof, v_metodo;
end;
$$;
revoke execute on function public.avisar_pago_anticipo(text, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 6. Adriana responde Recibido / No recibido
--    Con cita (solicitudes nuevas): Recibido confirma la cita; No recibido la cancela y libera el horario.
--    Sin cita (solicitudes anteriores a este cambio, con el horario apartado): funciona como antes.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.resolver_anticipo(p_telegram_message_id bigint, p_texto text)
returns table (
  accion          text,
  solicitud_id    bigint,
  telefono        text,
  numero_salon    text,
  nombre          text,
  mensaje_adriana text,
  mensaje_clienta text,
  ventana_abierta boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s          record;
  v_norm     text;
  v_decide   text;
  v_cita     uuid;
  v_nombre   text;
  v_serv     text;
  v_prof     text;
  v_cuando   text;
  v_ventana  boolean;
  v_err      text;
  v_link     text;
  v_aviso_wa text;
  v_c_estado text;
  v_c_fecha  timestamptz;
  v_c_dur    integer;
  v_c_upd    timestamptz;
  v_credito  numeric := 0;
  v_legacy   boolean;
begin
  select x.* into s
    from public.avisos_admin a
    join public.solicitudes_anticipo x on x.id = a.solicitud_anticipo_id
   where a.telegram_message_id = p_telegram_message_id
   limit 1;
  if s.id is null then
    return query select 'ninguna'::text, null::bigint, null::text, null::text, null::text, null::text, null::text, false;
    return;
  end if;

  select coalesce(nullif(btrim(c.nombre), ''), s.telefono) into v_nombre from public.clientes c where c.id = s.cliente_id;
  select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
  select p.nombre into v_prof from public.profesionales p where p.id = s.profesional_id;
  v_ventana := coalesce((select max(m.created_at) from public.mensajes_entrantes m where m.telefono = s.telefono) > now() - interval '24 hours', false);
  v_link := 'https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g');

  -- La cita que se agendó al llegar el comprobante (con su fecha actual, por si la clienta la movió).
  if s.cita_id is not null then
    select ci.estado, ci.fecha_hora, ci.duracion_min, ci.updated_at
      into v_c_estado, v_c_fecha, v_c_dur, v_c_upd
      from public.citas ci where ci.id = s.cita_id;
  end if;
  v_cuando := public.formato_cita_aviso(coalesce(v_c_fecha, s.inicio), coalesce(v_c_dur, s.duracion_total));
  v_legacy := s.cita_id is null and s.bloqueo_id is not null;

  if s.estado <> 'por_confirmar' then
    return query select 'no_pendiente'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Ese anticipo de ' || v_nombre || ' ya no está pendiente (' ||
        case s.estado when 'aprobada' then 'ya lo habías confirmado'
                      when 'rechazada' then 'ya lo habías marcado como no recibido'
                      when 'vencida' then case when s.cita_id is null then 'venció y el horario se liberó' else 'se cerró sin respuesta' end
                      when 'cancelada' then 'la clienta desistió o pidió otro horario'
                      else s.estado end
        || '). No hice ningún cambio.',
      null::text, v_ventana;
    return;
  end if;

  v_norm := regexp_replace(translate(lower(btrim(coalesce(p_texto, ''))), 'áéíóúü', 'aeiouu'), '[^a-z0-9 ]', '', 'g');
  v_norm := regexp_replace(v_norm, ' +', ' ', 'g');
  v_decide := case
    when v_norm ~ '^no( me| lo| ha| han| le| se)* (recibido|recibi|llego|llegado|aparece|veo|ha llegado|reflejado)' then 'no'
    when v_norm ~ '^(todavia|aun) no' then 'no'
    when v_norm ~ '^(si |ok |ya |listo )?(me |lo |ya |ha |les )*(recibido|recibi|llego|llegaron|confirmado|confirmo|reflejado)' then 'si'
    else null end;

  if v_decide is null then
    return query select 'no_entendido'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'No entendí tu respuesta. Responde ese aviso con Recibido o No recibido.', null::text, v_ventana;
    return;
  end if;

  v_aviso_wa := case when v_ventana then ' Le avisé por WhatsApp.'
                     else ' Pasaron más de 24 horas desde su último mensaje, así que no pude avisarle por WhatsApp: escríbele tú: ' || v_link end;

  -- ───────── No recibido ─────────
  if v_decide = 'no' then
    if v_legacy then
      delete from public.bloqueos_horario where id = s.bloqueo_id;
      update public.solicitudes_anticipo set estado = 'rechazada', resuelta_en = now(), bloqueo_id = null where id = s.id;
      return query select 'rechazada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
        'Listo, marqué como no recibido el anticipo de ' || v_nombre || ': no se agendó la cita y el horario quedó libre.' || v_aviso_wa,
        'Lo siento, no pudimos confirmar tu anticipo, por eso todavía no quedó agendada tu cita y el horario se liberó. Si ya hiciste el pago, envíanos el comprobante de nuevo, porfa, y lo revisamos 😊',
        v_ventana;
      return;
    end if;

    if v_c_estado in ('pendiente', 'confirmada') then
      begin
        update public.citas
           set estado = 'cancelada',
               notas_internas = 'Cancelada: anticipo no recibido'
         where id = s.cita_id;
        update public.solicitudes_anticipo set estado = 'rechazada', resuelta_en = now(), bloqueo_id = null where id = s.id;
      exception when others then
        get stacked diagnostics v_err = message_text;
        return query select 'error'::text, s.id, s.telefono, s.numero_salon, v_nombre,
          'No pude cancelar la cita de ' || v_nombre || ' (' || v_err || '). Sigue pendiente: cancélala desde el panel o escríbele: ' || v_link,
          null::text, v_ventana;
        return;
      end;
      return query select 'rechazada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
        'Listo, marqué como no recibido el anticipo de ' || v_nombre || ': cancelé su cita de ' || coalesce(v_serv, 'servicio') || ' (' || v_cuando || ') y el horario quedó libre.' || v_aviso_wa,
        'Lo siento, no pudimos confirmar tu anticipo, por eso cancelamos tu cita de ' || coalesce(v_serv, 'tu servicio') || ' (' || v_cuando || ') y el horario se liberó. Si ya hiciste el pago, envíanos el comprobante de nuevo, porfa, y lo revisamos 😊',
        v_ventana;
      return;
    end if;

    -- La cita ya estaba cancelada (la clienta la canceló), terminada o borrada: solo se cierra la solicitud.
    update public.solicitudes_anticipo set estado = 'rechazada', resuelta_en = now(), bloqueo_id = null where id = s.id;
    return query select 'rechazada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Listo, marqué como no recibido el anticipo de ' || v_nombre || '. ' ||
        case when v_c_estado is null then 'Su cita ya no existe en el calendario.'
             when v_c_estado = 'cancelada' then 'Su cita ya estaba cancelada, así que no cambié nada más.'
             else 'Su cita ya estaba "' || v_c_estado || '", así que no la modifiqué.' end,
      null::text, v_ventana;
    return;
  end if;

  -- ───────── Recibido ─────────
  if v_legacy then
    begin
      delete from public.bloqueos_horario where id = s.bloqueo_id;
      select r.cita_id into v_cita
        from public.crear_cita_con_adicionales(
               s.cliente_id, s.profesional_id, s.servicio_id, s.inicio, s.duracion_base,
               s.adicional_ids, 'whatsapp', 'confirmada', null) r;
      update public.citas set anticipo_monto = s.monto, anticipo_recibido_en = now() where id = v_cita;
      update public.solicitudes_anticipo
         set estado = 'aprobada', cita_id = v_cita, resuelta_en = now(), bloqueo_id = null
       where id = s.id;
    exception when others then
      get stacked diagnostics v_err = message_text;
      return query select 'error'::text, s.id, s.telefono, s.numero_salon, v_nombre,
        'No pude crear la cita de ' || v_nombre || ' (' || v_err || '). Sigue pendiente: revisa el calendario y agéndala desde el panel, o escríbele: ' || v_link,
        null::text, v_ventana;
      return;
    end;
    return query select 'aprobada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Listo, quedó confirmada la cita de ' || v_nombre || ': ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando
        || ', con anticipo de ' || public.formato_pesos(s.monto) || '.' || v_aviso_wa,
      'Listooo 😊 Recibimos tu anticipo, gracias!' || E'\n\n' || 'Tu cita quedó confirmada:' || E'\n\n' || '- ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando || '.'
        || coalesce(E'\n\n' || public.texto_calendario_cita(v_cita), ''),
      v_ventana;
    return;
  end if;

  if v_c_estado in ('pendiente', 'confirmada') then
    begin
      update public.citas
         set estado = 'confirmada',
             anticipo_monto = s.monto,
             anticipo_recibido_en = now(),
             notas_internas = case when notas_internas like 'Anticipo por validar%' then null else notas_internas end
       where id = s.cita_id;
      update public.solicitudes_anticipo set estado = 'aprobada', resuelta_en = now(), bloqueo_id = null where id = s.id;
    exception when others then
      get stacked diagnostics v_err = message_text;
      return query select 'error'::text, s.id, s.telefono, s.numero_salon, v_nombre,
        'No pude confirmar la cita de ' || v_nombre || ' (' || v_err || '). Sigue pendiente: confírmala desde el panel o escríbele: ' || v_link,
        null::text, v_ventana;
      return;
    end;
    return query select 'aprobada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Listo, quedó confirmada la cita de ' || v_nombre || ': ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando
        || ', con anticipo de ' || public.formato_pesos(s.monto) || '.' || v_aviso_wa,
      'Listooo 😊 Recibimos tu anticipo, gracias!' || E'\n\n' || 'Tu cita quedó confirmada:' || E'\n\n' || '- ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando || '.'
        || coalesce(E'\n\n' || public.texto_calendario_cita(s.cita_id), ''),
      v_ventana;
    return;
  end if;

  if v_c_estado is null then
    update public.solicitudes_anticipo set estado = 'aprobada', resuelta_en = now(), bloqueo_id = null where id = s.id;
    return query select 'aprobada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Marqué como recibido el anticipo de ' || v_nombre || ' (' || public.formato_pesos(s.monto) || '), pero su cita ya no existe en el calendario. Revisa si debes agendarla de nuevo o acreditarle ese valor como saldo a favor desde su ficha: ' || v_link,
      null::text, v_ventana;
    return;
  end if;

  -- La cita ya estaba cancelada o terminada: se registra el anticipo y solo se acredita si la clienta canceló con tiempo.
  begin
    update public.citas
       set anticipo_monto = s.monto,
           anticipo_recibido_en = now(),
           notas_internas = case when notas_internas like 'Anticipo por validar%' then null else notas_internas end
     where id = s.cita_id;
    if v_c_estado = 'cancelada' and v_c_fecha - v_c_upd >= make_interval(hours => public.horas_aviso_anticipo()) then
      v_credito := public.acreditar_anticipo_cita(s.cita_id, true);
    end if;
    update public.solicitudes_anticipo set estado = 'aprobada', resuelta_en = now(), bloqueo_id = null where id = s.id;
  exception when others then
    get stacked diagnostics v_err = message_text;
    return query select 'error'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'No pude registrar el anticipo de ' || v_nombre || ' (' || v_err || '). Regístralo desde el panel o escríbele: ' || v_link,
      null::text, v_ventana;
    return;
  end;
  return query select 'aprobada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
    'Registré como recibido el anticipo de ' || v_nombre || ' (' || public.formato_pesos(s.monto) || '). ' ||
      case when v_c_estado = 'cancelada' then
             'Su cita de ' || coalesce(v_serv, 'servicio') || ' (' || v_cuando || ') ya estaba cancelada' ||
             case when v_credito > 0 then ' con tiempo de aviso, así que le acredité ' || public.formato_pesos(v_credito) || ' como saldo a favor.'
                  else ' sin el tiempo de aviso, así que no le acredité saldo. Si quieres acreditárselo, hazlo desde su ficha.' end
           else 'Su cita ya estaba "' || v_c_estado || '", así que no la modifiqué.' end
      || ' Escríbele si hace falta: ' || v_link,
    null::text, v_ventana;
end;
$$;
revoke execute on function public.resolver_anticipo(bigint, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 7. Cierres automáticos
--    a) Sin pago a tiempo (esperando_pago): se libera el horario y se avisa a la clienta (igual que antes).
--    b) Solicitudes anteriores a este cambio (sin cita, con horario apartado): igual que antes.
--    c) Pago por validar con cita ya agendada: no vence por reloj; se cierra sola 7 días después de la cita.
--       La cita se queda como está y solo se avisa a Adriana. Sin recordatorio de 30 minutos: ahora lo hace
--       recordatorio_pagos_pendientes() a las horas que se configuren.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.liberar_anticipos_vencidos()
returns table (
  solicitud_id    bigint,
  telefono        text,
  numero_salon    text,
  mensaje_clienta text,
  ventana_abierta boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s         record;
  v_nombre  text;
  v_serv    text;
  v_ventana boolean;
  v_estado  text;
  v_fecha   timestamptz;
  v_dur     integer;
begin
  -- a) y b) Plazo vencido sin pago (o sin confirmar, en las solicitudes anteriores): se libera el horario.
  for s in
    select x.* from public.solicitudes_anticipo x
     where x.vence_en <= now()
       and (x.estado = 'esperando_pago' or (x.estado = 'por_confirmar' and x.cita_id is null and x.bloqueo_id is not null))
     order by x.id
     for update
  loop
    delete from public.bloqueos_horario where id = s.bloqueo_id;
    update public.solicitudes_anticipo set estado = 'vencida', resuelta_en = now(), bloqueo_id = null where id = s.id;

    select coalesce(nullif(btrim(c.nombre), ''), s.telefono) into v_nombre from public.clientes c where c.id = s.cliente_id;
    select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
    v_ventana := coalesce((select max(m.created_at) from public.mensajes_entrantes m where m.telefono = s.telefono) > now() - interval '24 hours', false);

    insert into public.avisos_admin (tipo, mensaje)
    values ('anticipo',
      case s.estado
        when 'esperando_pago' then 'Se liberó el horario de ' || v_nombre || ' (' || coalesce(v_serv, 'servicio') || ', ' || public.formato_cita_aviso(s.inicio, s.duracion_total) || '): no llegó el anticipo a tiempo.'
        else 'Se liberó el horario de ' || v_nombre || ' (' || coalesce(v_serv, 'servicio') || ', ' || public.formato_cita_aviso(s.inicio, s.duracion_total) || '): su anticipo quedó sin confirmar a tiempo. No se agendó.'
      end);

    -- Solo se avisa a la clienta cuando no pagó (si ya había avisado de su pago, Adriana la contacta).
    if s.estado = 'esperando_pago' then
      return query select s.id, s.telefono, s.numero_salon,
        'Como no recibimos tu anticipo a tiempo, liberamos el horario de ' || coalesce(v_serv, 'tu servicio') || ' (' || public.formato_cita_aviso(s.inicio, s.duracion_total) || '). Si todavía quieres tu cita, escríbeme y buscamos un horario.',
        v_ventana;
    end if;
  end loop;

  -- c) Pagos por validar con cita agendada que nadie resolvió: se cierran 7 días después de la cita.
  for s in
    select x.* from public.solicitudes_anticipo x
     where x.estado = 'por_confirmar'
       and not (x.cita_id is null and x.bloqueo_id is not null)
       and coalesce(
             (select ci.fecha_hora + make_interval(mins => ci.duracion_min) from public.citas ci where ci.id = x.cita_id),
             x.vence_en
           ) + interval '7 days' <= now()
     order by x.id
     for update
  loop
    select coalesce(nullif(btrim(c.nombre), ''), s.telefono) into v_nombre from public.clientes c where c.id = s.cliente_id;
    select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
    select ci.estado, ci.fecha_hora, ci.duracion_min into v_estado, v_fecha, v_dur from public.citas ci where ci.id = s.cita_id;

    update public.solicitudes_anticipo set estado = 'vencida', resuelta_en = now(), bloqueo_id = null where id = s.id;

    insert into public.avisos_admin (tipo, mensaje)
    values ('anticipo',
      'Cerré la solicitud de anticipo de ' || v_nombre || ' (' || public.formato_pesos(s.monto) || ', ' || coalesce(v_serv, 'servicio') || ', '
        || public.formato_cita_aviso(coalesce(v_fecha, s.inicio), coalesce(v_dur, s.duracion_total))
        || '): pasaron 7 días desde la cita sin que la validaras. '
        || case when v_estado is null then 'La cita ya no existe en el calendario.'
                else 'La cita quedó como estaba ("' || v_estado || '").' end
        || ' Si ya habías recibido el pago, regístralo desde la ficha de la clienta.');
  end loop;
end;
$$;
revoke execute on function public.liberar_anticipos_vencidos() from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 8. Recordatorio de pagos por validar (lo llama un disparador de AC-Admin-Avisos a las horas configuradas)
--    Reenvía a Adriana cada pago pendiente con sus botones Recibido / No recibido. Devuelve cuántos reenvió.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.recordatorio_pagos_pendientes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  s        record;
  n        integer := 0;
  v_hace   text;
  v_seg    numeric;
begin
  -- Pagos por validar que todavía no tienen en cola un recordatorio sin enviar.
  select count(*) into n
    from public.solicitudes_anticipo x
   where x.estado = 'por_confirmar'
     and not exists (select 1 from public.avisos_admin a where a.solicitud_anticipo_id = x.id and a.enviado_en is null);
  if n = 0 then
    return 0;
  end if;

  insert into public.avisos_admin (tipo, mensaje)
  values ('anticipo',
    case when n = 1 then 'Tienes 1 pago por validar. Te lo reenvío abajo: pulsa Recibido si ya te llegó o No recibido si no.'
         else 'Tienes ' || n || ' pagos por validar. Te los reenvío abajo, cada uno con sus botones: pulsa Recibido si ya te llegó o No recibido si no.' end);

  for s in
    select x.*,
           coalesce(nullif(btrim(cl.nombre), ''), x.telefono) as nombre_cl,
           sv.nombre as serv_nombre,
           pr.nombre as prof_nombre,
           ci.estado as cita_estado,
           ci.fecha_hora as cita_fecha,
           ci.duracion_min as cita_dur
      from public.solicitudes_anticipo x
      join public.clientes cl on cl.id = x.cliente_id
      left join public.servicios sv on sv.id = x.servicio_id
      left join public.profesionales pr on pr.id = x.profesional_id
      left join public.citas ci on ci.id = x.cita_id
     where x.estado = 'por_confirmar'
       and not exists (select 1 from public.avisos_admin a where a.solicitud_anticipo_id = x.id and a.enviado_en is null)
     order by coalesce(x.comprobante_en, x.creada_en), x.id
  loop
    v_seg := extract(epoch from (now() - coalesce(s.comprobante_en, s.creada_en)));
    v_hace := case
      when v_seg < 3600 then 'hace menos de 1 hora'
      when v_seg < 86400 then 'hace ' || floor(v_seg / 3600)::integer || case when floor(v_seg / 3600)::integer = 1 then ' hora' else ' horas' end
      else 'hace ' || floor(v_seg / 86400)::integer || case when floor(v_seg / 86400)::integer = 1 then ' día' else ' días' end end;

    insert into public.avisos_admin (tipo, mensaje, solicitud_anticipo_id)
    values ('anticipo',
      'Pago por validar: ' || s.nombre_cl || ' (' || s.telefono || ')'
        || chr(10) || 'Cita: ' || coalesce(s.serv_nombre, 'Servicio') || ' con ' || coalesce(s.prof_nombre, 'profesional') || ', '
        || public.formato_cita_aviso(coalesce(s.cita_fecha, s.inicio), coalesce(s.cita_dur, s.duracion_total))
        || case when s.cita_id is null then ' (todavía no está agendada: el horario sigue apartado)'
                when s.cita_estado = 'cancelada' then ' (esta cita está cancelada)'
                when s.cita_estado is null then ' (esta cita ya no existe en el calendario)'
                else '' end
        || chr(10) || 'Anticipo: ' || public.formato_pesos(s.monto) || ' (' || coalesce(s.metodo, 'transferencia') || ')'
        || chr(10) || 'Avisó el pago ' || v_hace
        || chr(10) || 'WhatsApp: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g')
        || chr(10) || chr(10) || 'Pulsa Recibido si ya te llegó (la cita queda confirmada) o No recibido si no (se cancela la cita y se libera el horario).',
      s.id);
  end loop;

  return n;
end;
$$;
revoke execute on function public.recordatorio_pagos_pendientes() from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 9. Estado del anticipo de la clienta (lo lee el agente al iniciar la conversación)
-- ──────────────────────────────────────────────────────────────────
create or replace function public.estado_anticipo_clienta(p_telefono text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cliente uuid;
  v_pct     integer;
  v_horas   integer;
  s         record;
begin
  select coalesce(cfg.porcentaje, 50), coalesce(cfg.horas_pago, 3) into v_pct, v_horas
    from public.configuracion_anticipos cfg where cfg.id = 1;
  v_pct := coalesce(v_pct, 50);
  v_horas := coalesce(v_horas, 3);

  select c.id into v_cliente from public.clientes c where c.telefono = p_telefono limit 1;

  -- Si hay un pago esperándose y otro por validar, manda el que se está esperando.
  select x.*, sv.nombre as servicio_nombre, ci.estado as cita_estado, ci.fecha_hora as cita_fecha, ci.duracion_min as cita_dur into s
    from public.solicitudes_anticipo x
    left join public.servicios sv on sv.id = x.servicio_id
    left join public.citas ci on ci.id = x.cita_id
   where x.cliente_id = v_cliente and x.estado in ('esperando_pago', 'por_confirmar')
   order by (x.estado = 'esperando_pago') desc, x.id desc
   limit 1;
  if s.id is not null then
    if s.estado = 'esperando_pago' then
      return 'esperando el pago de ' || public.formato_pesos(s.monto) || ' para apartar ' || coalesce(s.servicio_nombre, 'el servicio') || ' ('
        || public.formato_cita_aviso(s.inicio, s.duracion_total) || '); el horario está apartado hasta las '
        || to_char(s.vence_en at time zone 'America/Bogota', 'FMHH12:MI am');
    end if;
    if s.cita_id is null then
      return 'la clienta ya avisó su pago de ' || public.formato_pesos(s.monto) || ' (' || coalesce(s.metodo, 'transferencia') || ') y Adriana lo está confirmando; la cita ('
        || coalesce(s.servicio_nombre, 'servicio') || ', ' || public.formato_cita_aviso(s.inicio, s.duracion_total) || ') se agenda cuando ella lo confirme';
    end if;
    return 'la clienta ya avisó su pago de ' || public.formato_pesos(s.monto) || ' (' || coalesce(s.metodo, 'transferencia') || '); Adriana lo está validando. '
      || case when s.cita_estado = 'cancelada' then 'La cita (' || coalesce(s.servicio_nombre, 'servicio') || ') ya fue cancelada.'
              else 'Su cita ya está agendada (' || coalesce(s.servicio_nombre, 'servicio') || ', ' || public.formato_cita_aviso(coalesce(s.cita_fecha, s.inicio), coalesce(s.cita_dur, s.duracion_total))
                   || ') y queda confirmada cuando Adriana valide el pago' end
      || case when v_cliente is not null and public.requiere_anticipo(v_cliente)
              then '. Si quiere agendar otra cita, también se le pide anticipo del ' || v_pct || ' %'
              else '' end;
  end if;

  if v_cliente is null then
    return 'se le pedirá anticipo del ' || v_pct || ' % para agendar (clienta nueva)';
  end if;
  if public.requiere_anticipo(v_cliente) then
    return 'se le pide anticipo del ' || v_pct || ' % para agendar; el horario se aparta ' || v_horas || ' horas mientras paga';
  end if;
  return 'no se le pide anticipo';
end;
$$;
revoke execute on function public.estado_anticipo_clienta(text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 10. Cancelar la solicitud: si el pago ya está por validar, la cita ya existe y se cancela con cancelar_cita
-- ──────────────────────────────────────────────────────────────────
create or replace function public.cancelar_solicitud_anticipo(p_telefono text)
returns table (cancelada boolean, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select x.* into s
    from public.solicitudes_anticipo x
    join public.clientes c on c.id = x.cliente_id
   where c.telefono = p_telefono and x.estado = 'esperando_pago'
   limit 1;
  if s.id is null then
    if exists (
      select 1 from public.solicitudes_anticipo x
        join public.clientes c on c.id = x.cliente_id
       where c.telefono = p_telefono and x.estado = 'por_confirmar'
    ) then
      return query select false, 'La clienta ya envió su pago y su cita ya está agendada (Adriana está validando el pago): para cancelarla o moverla usa cancelar_cita o reprogramar_cita, no esta herramienta.';
    else
      return query select false, 'La clienta no tiene una solicitud de anticipo vigente.';
    end if;
    return;
  end if;
  delete from public.bloqueos_horario where id = s.bloqueo_id;
  update public.solicitudes_anticipo set estado = 'cancelada', resuelta_en = now(), bloqueo_id = null where id = s.id;
  return query select true, null::text;
end;
$$;
revoke execute on function public.cancelar_solicitud_anticipo(text) from public, anon, authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- REVERSA (en orden): restaurar las funciones de 20261026000000_texto_aviso_anticipo.sql y anteriores
--   (solicitar_anticipo, avisar_pago_anticipo, resolver_anticipo, liberar_anticipos_vencidos, estado_anticipo_clienta, cancelar_solicitud_anticipo),
--   drop function public.recordatorio_pagos_pendientes();
--   drop function public.exigir_cita_sin_anticipo(uuid, uuid); y recrear exigir_cita_sin_anticipo(uuid) de 20261021000005;
--   drop index public.uq_solicitud_anticipo_esperando; recrear uq_solicitud_anticipo_viva (estado in ('esperando_pago','por_confirmar'));
--   alter table public.servicios drop column sin_anticipo;
-- (Antes de la reversa, resuelve las solicitudes 'por_confirmar' que ya tengan cita.)
-- ══════════════════════════════════════════════════════════════════
