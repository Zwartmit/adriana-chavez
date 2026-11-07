-- Información para clientas por servicio + cuentas de pago por profesional (6 nov 2026). Idempotente.
--
--   1. servicios.informacion_clientas: texto largo que escribe Adriana (en qué consiste, dolor, cuidados, etc.).
--      El asistente de WhatsApp responde las dudas de la clienta SOLO con este texto; no se muestra en la web.
--   2. profesionales_cuentas: cuenta para transferir de cada profesional. Tabla aparte y solo para administradoras
--      porque `profesionales` es de lectura pública. Si la profesional no tiene cuenta, se usa la general
--      (configuracion_anticipos.datos_transferencia) como respaldo.
--   3. solicitar_anticipo: igual que antes, pero devuelve la cuenta de la profesional de la cita si existe.
--   4. admin_cuentas_profesionales: consultar / guardar / borrar desde Telegram (solo administradoras, lo valida el agente
--      con el rol y el permiso EXECUTE solo para postgres).
-- Para revertir: ver el final del archivo.
begin;

alter table public.servicios add column if not exists informacion_clientas text;
alter table public.servicios drop constraint if exists servicios_informacion_clientas_largo;
alter table public.servicios add constraint servicios_informacion_clientas_largo
  check (informacion_clientas is null or char_length(informacion_clientas) <= 3000);
comment on column public.servicios.informacion_clientas is
  'Texto para que el asistente de WhatsApp responda dudas de la clienta (dolor, cuidados, etc.). Máx. 3000 caracteres.';

create table if not exists public.profesionales_cuentas (
  profesional_id     uuid primary key references public.profesionales(id) on delete cascade,
  datos_transferencia text not null check (char_length(btrim(datos_transferencia)) between 1 and 1000),
  updated_at         timestamptz not null default now()
);
alter table public.profesionales_cuentas enable row level security;
drop policy if exists "Admin lee cuentas profesionales" on public.profesionales_cuentas;
create policy "Admin lee cuentas profesionales" on public.profesionales_cuentas
  for select to authenticated using (public.es_admin());
drop policy if exists "Admin modifica cuentas profesionales" on public.profesionales_cuentas;
create policy "Admin modifica cuentas profesionales" on public.profesionales_cuentas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
revoke all on public.profesionales_cuentas from anon;

-- ──────────────────────────────────────────────────────────────────
-- solicitar_anticipo con la cuenta de la profesional
-- ──────────────────────────────────────────────────────────────────
create or replace function public.solicitar_anticipo(
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
  -- Cuenta propia de la profesional (si la tiene); si no, queda la cuenta general como respaldo
  v_datos := coalesce(
    (select nullif(btrim(pc.datos_transferencia), '') from public.profesionales_cuentas pc where pc.profesional_id = p_profesional),
    v_datos);
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

-- ──────────────────────────────────────────────────────────────────
-- Telegram (administradoras): consultar / guardar / borrar la cuenta de una profesional
--   p_accion: 'consultar' (p_profesional vacío = todas), 'guardar', 'borrar'. p_profesional = nombre (o parte).
-- ──────────────────────────────────────────────────────────────────
create or replace function public.admin_cuentas_profesionales(
  p_accion      text,
  p_profesional text default null,
  p_datos       text default null
) returns table (ok boolean, mensaje text, profesional_nombre text, cuenta text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_n   int;
  v_id  uuid;
  v_nom text;
  v_txt text := nullif(btrim(coalesce(p_datos, '')), '');
  v_busq text := nullif(btrim(coalesce(p_profesional, '')), '');
begin
  if p_accion not in ('consultar', 'guardar', 'borrar') then
    return query select false, 'Acción no válida: usa consultar, guardar o borrar.', null::text, null::text; return;
  end if;

  if p_accion = 'consultar' and v_busq is null then
    return query
      select true, case when pc.profesional_id is null then 'Sin cuenta propia (usa la general)' else 'Cuenta propia' end,
             p.nombre, pc.datos_transferencia
        from public.profesionales p
        left join public.profesionales_cuentas pc on pc.profesional_id = p.id
       where p.activo order by p.nombre;
    return;
  end if;

  if v_busq is null then
    return query select false, 'Indica de qué profesional.', null::text, null::text; return;
  end if;

  select count(*) into v_n from public.profesionales p where p.activo and p.nombre ilike '%' || v_busq || '%';
  if v_n = 0 then
    return query select false, 'No encontré una profesional activa con ese nombre.', null::text, null::text; return;
  elsif v_n > 1 then
    return query select false, 'Hay varias profesionales con ese nombre: ' ||
      (select string_agg(p.nombre, ', ' order by p.nombre) from public.profesionales p where p.activo and p.nombre ilike '%' || v_busq || '%') ||
      '. Indica cuál.', null::text, null::text; return;
  end if;
  select p.id, p.nombre into v_id, v_nom from public.profesionales p where p.activo and p.nombre ilike '%' || v_busq || '%';

  if p_accion = 'consultar' then
    return query select true, case when pc.profesional_id is null then 'Sin cuenta propia (usa la general)' else 'Cuenta propia' end,
                        v_nom, pc.datos_transferencia
                   from (select 1) x left join public.profesionales_cuentas pc on pc.profesional_id = v_id;
  elsif p_accion = 'borrar' then
    delete from public.profesionales_cuentas where profesional_id = v_id;
    return query select true, 'Cuenta propia borrada: ahora usa la general.', v_nom, null::text;
  else
    if v_txt is null then
      return query select false, 'Falta el texto de la cuenta.', v_nom, null::text; return;
    end if;
    if char_length(v_txt) > 1000 then
      return query select false, 'Los datos no pueden pasar de 1000 caracteres.', v_nom, null::text; return;
    end if;
    insert into public.profesionales_cuentas (profesional_id, datos_transferencia) values (v_id, v_txt)
      on conflict (profesional_id) do update set datos_transferencia = excluded.datos_transferencia, updated_at = now();
    return query select true, 'Cuenta guardada.', v_nom, v_txt;
  end if;
end;
$$;
revoke execute on function public.admin_cuentas_profesionales(text, text, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- Telegram (administradoras): consultar / guardar / agregar / borrar la información para clientas de un servicio
--   p_accion: 'consultar', 'guardar' (reemplaza todo), 'agregar' (añade al final), 'borrar'. p_servicio = id del servicio.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.admin_informacion_servicio(
  p_servicio text,
  p_accion   text default 'consultar',
  p_texto    text default null
) returns table (ok boolean, mensaje text, servicio_nombre text, informacion text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id   uuid;
  v_nom  text;
  v_act  text;
  v_txt  text := nullif(btrim(coalesce(p_texto, '')), '');
  v_nuevo text;
begin
  if p_accion not in ('consultar', 'guardar', 'agregar', 'borrar') then
    return query select false, 'Acción no válida: usa consultar, guardar, agregar o borrar.', null::text, null::text; return;
  end if;
  if btrim(coalesce(p_servicio, '')) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return query select false, 'Falta el id del servicio (búscalo primero con buscar_servicio).', null::text, null::text; return;
  end if;
  select s.id, s.nombre, s.informacion_clientas into v_id, v_nom, v_act from public.servicios s where s.id = btrim(p_servicio)::uuid;
  if v_id is null then
    return query select false, 'No existe ese servicio.', null::text, null::text; return;
  end if;

  if p_accion = 'consultar' then
    return query select true, case when v_act is null then 'Sin información registrada.' else 'Información registrada.' end, v_nom, v_act; return;
  elsif p_accion = 'borrar' then
    update public.servicios set informacion_clientas = null where id = v_id;
    return query select true, 'Información borrada.', v_nom, null::text; return;
  end if;

  if v_txt is null then
    return query select false, 'Falta el texto.', v_nom, v_act; return;
  end if;
  v_nuevo := case when p_accion = 'agregar' and v_act is not null then v_act || E'\n' || v_txt else v_txt end;
  if char_length(v_nuevo) > 3000 then
    return query select false, 'El texto pasaría de 3000 caracteres: acórtalo.', v_nom, v_act; return;
  end if;
  update public.servicios set informacion_clientas = v_nuevo where id = v_id;
  return query select true, case when p_accion = 'agregar' then 'Información ampliada.' else 'Información guardada.' end, v_nom, v_nuevo;
end;
$$;
revoke execute on function public.admin_informacion_servicio(text, text, text) from public, anon, authenticated;

commit;

-- ──────────────────────────────────────────────────────────────────
-- PARA REVERTIR (solo si hace falta):
--   drop function if exists public.admin_informacion_servicio(text, text, text);
--   drop function if exists public.admin_cuentas_profesionales(text, text, text);
--   drop table if exists public.profesionales_cuentas;
--   alter table public.servicios drop constraint if exists servicios_informacion_clientas_largo;
--   alter table public.servicios drop column if exists informacion_clientas;
--   -- y volver a aplicar la definición de solicitar_anticipo de 20261027000000_anticipo_cita_inmediata.sql (sección 4)
-- ──────────────────────────────────────────────────────────────────
