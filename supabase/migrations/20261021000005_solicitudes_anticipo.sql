-- Anticipos (21 oct 2026), etapa 2: solicitud de anticipo, bloqueo temporal y aprobación. Idempotente.
-- Reglas de Brandon: la cita NO se agenda hasta que Adriana confirme el pago. La clienta paga y envía el
-- comprobante, el agente avisa a Adriana por Telegram y ella responde "Recibido" (se crea la cita) o
-- "No recibido" (no se crea). El horario se aparta unas horas (configuracion_anticipos.horas_pago) mientras tanto.
--
-- Flujo en la base:
--   1. solicitar_anticipo()      : valida el horario, calcula el monto, aparta el horario con un bloqueo
--                                  "Anticipo pendiente: <clienta>" y devuelve los datos para pagar.
--   2. avisar_pago_anticipo()    : la clienta dice que pagó / envió el comprobante: pasa a "por_confirmar"
--                                  y deja el aviso para Adriana (cola de Telegram) con Recibido / No recibido.
--   3. resolver_anticipo()       : Adriana responde el aviso: Recibido crea la cita confirmada con el anticipo
--                                  registrado; No recibido libera el horario. Devuelve los mensajes a enviar.
--   4. liberar_anticipos_vencidos(): cada pocos minutos libera los horarios cuyo plazo venció y recuerda a
--                                  Adriana (una vez) los pagos por confirmar.
--   5. cancelar_solicitud_anticipo(): la clienta desiste.
--   6. exigir_cita_sin_anticipo(): candado para agendar_cita: una clienta que debe anticipo no puede agendar directo.
--   7. estado_anticipo_clienta() : texto para el contexto del agente de WhatsApp.
-- Estados de la solicitud: esperando_pago, por_confirmar, aprobada, rechazada, vencida, cancelada.
begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Tabla de solicitudes
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.solicitudes_anticipo (
  id                bigint generated always as identity primary key,
  cliente_id        uuid not null references public.clientes(id) on delete cascade,
  telefono          text not null,
  numero_salon      text,
  profesional_id    uuid not null references public.profesionales(id) on delete cascade,
  servicio_id       uuid not null references public.servicios(id) on delete cascade,
  inicio            timestamptz not null,
  duracion_base     integer,
  duracion_total    integer not null check (duracion_total > 0),
  adicional_ids     uuid[] not null default '{}',
  total_desde       numeric(12,0) not null,
  monto             numeric(12,0) not null check (monto > 0),
  porcentaje        smallint not null,
  estado            text not null default 'esperando_pago'
                    check (estado in ('esperando_pago', 'por_confirmar', 'aprobada', 'rechazada', 'vencida', 'cancelada')),
  metodo            text,
  bloqueo_id        uuid references public.bloqueos_horario(id) on delete set null,
  cita_id           uuid references public.citas(id) on delete set null,
  creada_en         timestamptz not null default now(),
  vence_en          timestamptz not null,
  comprobante_en    timestamptz,
  recordatorio_en   timestamptz,
  resuelta_en       timestamptz
);

-- Una sola solicitud viva por clienta (si pide otro horario, la anterior se cancela).
create unique index if not exists uq_solicitud_anticipo_viva
  on public.solicitudes_anticipo (cliente_id)
  where estado in ('esperando_pago', 'por_confirmar');
create index if not exists idx_solicitudes_anticipo_vigentes
  on public.solicitudes_anticipo (vence_en)
  where estado in ('esperando_pago', 'por_confirmar');

comment on table public.solicitudes_anticipo is 'Solicitudes de anticipo para agendar. La cita solo se crea cuando Adriana confirma el pago (estado aprobada).';
comment on column public.solicitudes_anticipo.vence_en is 'Hasta cuándo se aparta el horario esperando el pago (o el inicio de la cita, lo que ocurra primero).';

alter table public.solicitudes_anticipo enable row level security;
revoke all on public.solicitudes_anticipo from anon, authenticated;
drop policy if exists "Staff lee solicitudes de anticipo" on public.solicitudes_anticipo;
create policy "Staff lee solicitudes de anticipo" on public.solicitudes_anticipo
  for select to authenticated using (public.es_staff());
grant select on public.solicitudes_anticipo to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 2. La cola de Telegram: tipo nuevo y vínculo con la solicitud (para saber a cuál responde Adriana)
-- ──────────────────────────────────────────────────────────────────
alter table public.avisos_admin
  add column if not exists solicitud_anticipo_id bigint references public.solicitudes_anticipo(id) on delete set null;
comment on column public.avisos_admin.solicitud_anticipo_id is 'Solicitud de anticipo por confirmar a la que responde Adriana (Recibido / No recibido). Solo en los avisos que piden esa respuesta.';

do $$
declare
  r record;
  v_tipos text;
begin
  select string_agg(quote_literal(t), ', ' order by t) into v_tipos
    from (
      select distinct tipo as t from public.avisos_admin
      union
      select unnest(array['cita_nueva', 'cita_cancelada', 'cita_reprogramada', 'escalamiento', 'hueco_libre', 'anticipo'])
    ) x;

  for r in
    select conname from pg_constraint
     where conrelid = 'public.avisos_admin'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%tipo%'
  loop
    execute format('alter table public.avisos_admin drop constraint %I', r.conname);
  end loop;

  execute format('alter table public.avisos_admin add constraint avisos_admin_tipo_check check (tipo in (%s))', v_tipos);
end;
$$;

-- ──────────────────────────────────────────────────────────────────
-- 3. Ayudantes de formato
-- ──────────────────────────────────────────────────────────────────
create or replace function public.formato_pesos(p_valor numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select '$' || replace(to_char(coalesce(p_valor, 0), 'FM999,999,999,999'), ',', '.');
$$;
revoke execute on function public.formato_pesos(numeric) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 4. Solicitar el anticipo: valida, aparta el horario y devuelve los datos para pagar
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

  select s.duracion_min, s.precio, s.nombre into v_base, v_srv, v_srv_nom from public.servicios s where s.id = p_servicio;
  if v_srv_nom is null then
    return query select false, 'No se encontró el servicio.', null::bigint, null::numeric, null::text, null::integer, null::text, null::integer, null::text, null::text, null::text, null::text, null::text;
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
   where x.cliente_id = v_cliente and x.estado in ('esperando_pago', 'por_confirmar') and x.bloqueo_id is not null;

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

  -- Todo es válido: se cancela la solicitud anterior de la clienta (si tenía) y se libera su horario.
  for v_viejo in
    select x.id, x.bloqueo_id from public.solicitudes_anticipo x
     where x.cliente_id = v_cliente and x.estado in ('esperando_pago', 'por_confirmar')
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
-- 5. La clienta dice que pagó / envió el comprobante: se avisa a Adriana
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.avisar_pago_anticipo(text, text);
create function public.avisar_pago_anticipo(p_telefono text, p_metodo text default 'transferencia')
returns table (ok boolean, error text, solicitud_id bigint, ya_avisada boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  s        record;
  v_metodo text := case when lower(coalesce(p_metodo, '')) like '%efectivo%' then 'efectivo' else 'transferencia' end;
begin
  select x.* into s
    from public.solicitudes_anticipo x
    join public.clientes c on c.id = x.cliente_id
   where c.telefono = p_telefono and x.estado in ('esperando_pago', 'por_confirmar')
   limit 1;
  if s.id is null then
    return query select false, 'La clienta no tiene una solicitud de anticipo vigente (puede haber vencido: vuelve a solicitarla con solicitar_anticipo si ella aún quiere la cita).', null::bigint, false;
    return;
  end if;

  if s.estado = 'por_confirmar' then
    return query select true, null::text, s.id, true;
    return;
  end if;

  -- Transferencia: mientras Adriana revisa, el horario sigue apartado hasta el inicio de la cita.
  -- Efectivo: la clienta puede pagar en el salón antes de la cita, al llegar o al terminar el servicio,
  -- así que el horario queda apartado hasta que termine la cita.
  update public.solicitudes_anticipo
     set estado = 'por_confirmar', metodo = v_metodo, comprobante_en = now(),
         vence_en = case when v_metodo = 'efectivo' then s.inicio + make_interval(mins => s.duracion_total) else s.inicio end
   where id = s.id;

  insert into public.avisos_admin (tipo, mensaje, solicitud_anticipo_id)
  select 'anticipo',
         'Anticipo por confirmar: ' || coalesce(nullif(btrim(cl.nombre), ''), 'sin nombre registrado')
           || ' (' || s.telefono || ')'
           || chr(10) || 'Cita: ' || coalesce(sv.nombre, 'Servicio') || ' con ' || coalesce(p.nombre, 'profesional')
           || ', ' || public.formato_cita_aviso(s.inicio, s.duracion_total)
           || chr(10) || 'Anticipo: ' || public.formato_pesos(s.monto) || ' (' || s.porcentaje || ' % de ' || public.formato_pesos(s.total_desde) || ')'
           || chr(10) || case when v_metodo = 'efectivo'
                              then 'Forma de pago: efectivo (lo pagará en el salón: antes de la cita, al llegar o al terminar el servicio; el horario queda apartado hasta que termine la cita)'
                              else 'Forma de pago: transferencia' end
           || chr(10) || 'WhatsApp: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g')
           || chr(10) || chr(10) || case when v_metodo = 'efectivo'
                                       then 'Cuando tengas el efectivo, responde a este mensaje con Recibido (se agenda la cita). Si no lo paga, responde No recibido y se libera el horario.'
                                       else 'Revisa que el pago haya llegado y responde a este mensaje con Recibido (se agenda la cita) o No recibido (no se agenda).' end,
         s.id
    from public.clientes cl
    left join public.servicios sv on sv.id = s.servicio_id
    left join public.profesionales p on p.id = s.profesional_id
   where cl.id = s.cliente_id;

  return query select true, null::text, s.id, false;
end;
$$;
revoke execute on function public.avisar_pago_anticipo(text, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 6. Adriana responde el aviso: Recibido / No recibido
--    p_telegram_message_id = id del mensaje de Telegram al que responde; p_texto = lo que escribió.
--    Devuelve qué hacer: mensaje_adriana (confirmación para ella) y mensaje_clienta (para enviar por WhatsApp).
--    accion: ninguna (el aviso no es de un anticipo), no_entendido, aprobada, rechazada, no_pendiente, error.
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.resolver_anticipo(bigint, text);
create function public.resolver_anticipo(p_telegram_message_id bigint, p_texto text)
returns table (
  accion           text,
  solicitud_id     bigint,
  telefono         text,
  numero_salon     text,
  nombre           text,
  mensaje_adriana  text,
  mensaje_clienta  text,
  ventana_abierta  boolean
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
  v_cuando := public.formato_cita_aviso(s.inicio, s.duracion_total);
  v_ventana := coalesce((select max(m.created_at) from public.mensajes_entrantes m where m.telefono = s.telefono) > now() - interval '24 hours', false);

  if s.estado <> 'por_confirmar' then
    return query select 'no_pendiente'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Ese anticipo de ' || v_nombre || ' ya no está pendiente (' ||
        case s.estado when 'aprobada' then 'ya lo habías confirmado y la cita quedó agendada'
                      when 'rechazada' then 'ya lo habías marcado como no recibido'
                      when 'vencida' then 'venció y el horario se liberó'
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

  if v_decide = 'no' then
    delete from public.bloqueos_horario where id = s.bloqueo_id;
    update public.solicitudes_anticipo set estado = 'rechazada', resuelta_en = now(), bloqueo_id = null where id = s.id;
    return query select 'rechazada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
      'Listo, marqué como no recibido el anticipo de ' || v_nombre || ': no se agendó la cita y el horario quedó libre.'
        || case when v_ventana then ' Le avisé por WhatsApp.' else ' Pasaron más de 24 horas desde su último mensaje, así que no pude avisarle por WhatsApp: escríbele tú: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g') end,
      'Lo siento, no pudimos confirmar tu anticipo, por eso todavía no quedó agendada tu cita y el horario se liberó. Si ya hiciste el pago, envíanos el comprobante de nuevo, porfa, y lo revisamos 😊',
      v_ventana;
    return;
  end if;

  -- Recibido: se quita el bloqueo y se crea la cita confirmada con el anticipo registrado.
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
      'No pude crear la cita de ' || v_nombre || ' (' || v_err || '). Sigue pendiente: revisa el calendario y agéndala desde el panel, o escríbele: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g'),
      null::text, v_ventana;
    return;
  end;

  return query select 'aprobada'::text, s.id, s.telefono, s.numero_salon, v_nombre,
    'Listo, quedó confirmada la cita de ' || v_nombre || ': ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando
      || ', con anticipo de ' || public.formato_pesos(s.monto) || '.'
      || case when v_ventana then ' Le avisé por WhatsApp.' else ' Pasaron más de 24 horas desde su último mensaje, así que no pude avisarle por WhatsApp: escríbele tú: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g') end,
    'Listooo 😊 Recibimos tu anticipo, gracias!' || E'\n\n' || 'Tu cita quedó confirmada:' || E'\n\n' || '- ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando || '.',
    v_ventana;
end;
$$;
revoke execute on function public.resolver_anticipo(bigint, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 7. La clienta desiste
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.cancelar_solicitud_anticipo(text);
create function public.cancelar_solicitud_anticipo(p_telefono text)
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
   where c.telefono = p_telefono and x.estado in ('esperando_pago', 'por_confirmar')
   limit 1;
  if s.id is null then
    return query select false, 'La clienta no tiene una solicitud de anticipo vigente.';
    return;
  end if;
  if s.estado = 'por_confirmar' then
    return query select false, 'El pago ya está en revisión de Adriana: avísale con avisar_adriana y no cancelo nada.';
    return;
  end if;
  delete from public.bloqueos_horario where id = s.bloqueo_id;
  update public.solicitudes_anticipo set estado = 'cancelada', resuelta_en = now(), bloqueo_id = null where id = s.id;
  return query select true, null::text;
end;
$$;
revoke execute on function public.cancelar_solicitud_anticipo(text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 8. Liberar los horarios vencidos y recordar a Adriana los pagos por confirmar
--    La llama un flujo de n8n cada 5 minutos. Devuelve los mensajes de WhatsApp que hay que enviar a las clientas.
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.liberar_anticipos_vencidos();
create function public.liberar_anticipos_vencidos()
returns table (
  solicitud_id     bigint,
  telefono         text,
  numero_salon     text,
  mensaje_clienta  text,
  ventana_abierta  boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s        record;
  v_nombre text;
  v_serv   text;
  v_ventana boolean;
begin
  -- a) Plazo vencido sin pago (o sin confirmar cuando ya empezó la cita): se libera el horario.
  for s in
    select x.* from public.solicitudes_anticipo x
     where x.estado in ('esperando_pago', 'por_confirmar') and x.vence_en <= now()
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

  -- b) Pagos por confirmar sin respuesta de Adriana: un recordatorio a los 30 minutos (una sola vez).
  insert into public.avisos_admin (tipo, mensaje, solicitud_anticipo_id)
  select 'anticipo',
         'Recordatorio: ' || coalesce(nullif(btrim(cl.nombre), ''), z.telefono) || ' está esperando que confirmes su anticipo de '
           || public.formato_pesos(z.monto) || ' (' || coalesce(sv.nombre, 'servicio') || ', ' || public.formato_cita_aviso(z.inicio, z.duracion_total)
           || '). Responde este mensaje con Recibido o No recibido.',
         z.id
    from public.solicitudes_anticipo z
    join public.clientes cl on cl.id = z.cliente_id
    left join public.servicios sv on sv.id = z.servicio_id
   where z.estado = 'por_confirmar' and z.recordatorio_en is null and z.metodo is distinct from 'efectivo'
     and z.comprobante_en <= now() - interval '30 minutes';
  update public.solicitudes_anticipo z set recordatorio_en = now()
   where z.estado = 'por_confirmar' and z.recordatorio_en is null and z.metodo is distinct from 'efectivo'
     and z.comprobante_en <= now() - interval '30 minutes';
end;
$$;
revoke execute on function public.liberar_anticipos_vencidos() from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 9. Candado: una clienta que debe anticipo no puede agendar directo (lo usa agendar_cita de AC-Clientes)
-- ──────────────────────────────────────────────────────────────────
create or replace function public.exigir_cita_sin_anticipo(p_cliente uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(public.requiere_anticipo(p_cliente), false) then
    raise exception 'Esta clienta debe pagar anticipo para agendar: usa solicitar_anticipo y no agendar_cita.' using errcode = 'P0001';
  end if;
  return true;
end;
$$;
revoke execute on function public.exigir_cita_sin_anticipo(uuid) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 10. Texto de contexto para el agente de WhatsApp (línea [Anticipo ...])
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

  select x.*, sv.nombre as servicio_nombre into s
    from public.solicitudes_anticipo x
    left join public.servicios sv on sv.id = x.servicio_id
   where x.cliente_id = v_cliente and x.estado in ('esperando_pago', 'por_confirmar')
   limit 1;
  if s.id is not null then
    if s.estado = 'esperando_pago' then
      return 'esperando el pago de ' || public.formato_pesos(s.monto) || ' para apartar ' || coalesce(s.servicio_nombre, 'el servicio') || ' ('
        || public.formato_cita_aviso(s.inicio, s.duracion_total) || '); el horario está apartado hasta las '
        || to_char(s.vence_en at time zone 'America/Bogota', 'FMHH12:MI am');
    end if;
    return 'la clienta ya avisó su pago de ' || public.formato_pesos(s.monto) || ' (' || coalesce(s.metodo, 'transferencia') || ') y Adriana lo está confirmando; la cita ('
      || coalesce(s.servicio_nombre, 'servicio') || ', ' || public.formato_cita_aviso(s.inicio, s.duracion_total) || ') se agenda cuando ella lo confirme';
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

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (solo si hay que deshacer; antes libera los horarios apartados):
--   delete from public.bloqueos_horario where motivo like 'Anticipo pendiente:%';
--   drop function if exists public.estado_anticipo_clienta(text);
--   drop function if exists public.exigir_cita_sin_anticipo(uuid);
--   drop function if exists public.liberar_anticipos_vencidos();
--   drop function if exists public.cancelar_solicitud_anticipo(text);
--   drop function if exists public.resolver_anticipo(bigint, text);
--   drop function if exists public.avisar_pago_anticipo(text, text);
--   drop function if exists public.solicitar_anticipo(text, uuid, uuid, timestamptz, integer, uuid[], text);
--   drop function if exists public.formato_pesos(numeric);
--   alter table public.avisos_admin drop column if exists solicitud_anticipo_id;
--   drop table if exists public.solicitudes_anticipo;
--   (la restricción avisos_admin_tipo_check puede quedarse con el tipo extra)
-- ══════════════════════════════════════════════════════════════════
