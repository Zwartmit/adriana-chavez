-- Alargar una cita (21 oct 2026). Idempotente.
-- Adriana le dice al asistente de Telegram que una cita se alarga N minutos. La función alargar_cita():
--   · si la nueva hora de fin choca con otra cita de la profesional (o con un bloqueo, de ella o de todo
--     el salón), NO cambia nada y devuelve con quién choca y cuántos minutos sí alcanzan;
--   · si no choca, suma los minutos a duracion_min (el precio no cambia).
-- Una cita que ya se está atendiendo puede pasarse del cierre o del almuerzo (pasa en la vida real):
-- en ese caso se permite y se devuelve un aviso. Para eso el trigger de citas se salta SOLO la regla de
-- horario del salón cuando esta función lo indica (variable de sesión app.omitir_horario); los choques
-- con otras citas y bloqueos de la misma profesional se siguen validando siempre.
begin;

create or replace function public.validar_solapamiento_citas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duracion_min integer;
  v_fin_new timestamptz;
  v_motivo text;
begin
  if new.estado in ('cancelada', 'no_asistio') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not (
         new.fecha_hora IS DISTINCT FROM old.fecha_hora or
         new.duracion_min IS DISTINCT FROM old.duracion_min or
         new.profesional_id IS DISTINCT FROM old.profesional_id or
         new.servicio_id IS DISTINCT FROM old.servicio_id or
         (old.estado in ('cancelada', 'no_asistio') and new.estado not in ('cancelada', 'no_asistio'))
       ) then
      return new;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.profesional_id::text));

  v_duracion_min := coalesce(
    new.duracion_min,
    (select s.duracion_min from public.servicios s where s.id = new.servicio_id),
    60
  );
  v_fin_new := new.fecha_hora + make_interval(mins => v_duracion_min);

  -- 1. Contra otras citas activas de la misma profesional
  if exists (
    select 1 from public.citas c
    where c.profesional_id = new.profesional_id
      and c.id is distinct from new.id
      and c.estado not in ('cancelada', 'no_asistio')
      and new.fecha_hora < c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60))
      and v_fin_new > c.fecha_hora
  ) then
    raise exception 'La profesional ya tiene una cita en ese horario' using errcode = '23P01';
  end if;

  -- 2. Contra bloqueos de horario
  if exists (
    select 1 from public.bloqueos_horario b
    where b.profesional_id = new.profesional_id
      and new.fecha_hora < b.fecha_fin
      and v_fin_new > b.fecha_inicio
  ) then
    raise exception 'La profesional tiene un bloqueo en ese horario' using errcode = '23P01';
  end if;

  -- 3. Reglas de horario del salón (la exención por días la resuelve horario_violado).
  --    Se omite solo cuando alargar_cita() lo pide para esta misma transacción.
  if coalesce(current_setting('app.omitir_horario', true), '') <> 'si' then
    v_motivo := public.horario_violado(new.profesional_id, new.servicio_id, new.fecha_hora, v_fin_new);
    if v_motivo is not null then
      raise exception 'Horario no permitido: %', v_motivo using errcode = '23P01';
    end if;
  end if;

  return new;
end;
$$;
revoke execute on function public.validar_solapamiento_citas() from public, anon, authenticated;

drop function if exists public.alargar_cita(uuid, integer);
create function public.alargar_cita(p_cita_id uuid, p_minutos integer)
returns table (
  alargada            boolean,
  motivo              text,
  cliente             text,
  profesional         text,
  servicio            text,
  inicio_local        text,
  fin_anterior_local  text,
  fin_nuevo_local     text,
  duracion_nueva      integer,
  aviso_horario       text,
  choca_con           text,
  choca_detalle       text,
  choca_inicio_local  text,
  choca_fin_local     text,
  minutos_libres      integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r        record;
  k        record;
  v_dur    integer;
  v_fin    timestamptz;
  v_nuevo  timestamptz;
  v_antes  text;
  v_despues text;
begin
  if p_cita_id is null then
    alargada := false; motivo := 'No se encontró esa cita.';
    return next; return;
  end if;

  select c.id, c.estado::text as estado, c.fecha_hora, c.duracion_min, c.profesional_id, c.servicio_id,
         cl.nombre as cliente, p.nombre as profesional, s.nombre as servicio, s.duracion_min as dur_servicio
    into r
    from public.citas c
    join public.clientes cl on cl.id = c.cliente_id
    left join public.profesionales p on p.id = c.profesional_id
    left join public.servicios s on s.id = c.servicio_id
   where c.id = p_cita_id
     for update of c;

  if not found then
    alargada := false; motivo := 'No se encontró esa cita.';
    return next; return;
  end if;

  cliente := r.cliente; profesional := r.profesional; servicio := r.servicio;

  if p_minutos is null or p_minutos < 1 or p_minutos > 240 then
    alargada := false; motivo := 'Los minutos para alargar deben ser un número entre 1 y 240.';
    return next; return;
  end if;

  if r.estado not in ('pendiente', 'confirmada', 'en_proceso') then
    alargada := false;
    motivo := case r.estado
      when 'cancelada'  then 'La cita está cancelada.'
      when 'no_asistio' then 'La cita está marcada como inasistencia.'
      when 'completada' then 'La cita ya está completada.'
      else 'La cita no se puede alargar en su estado actual.' end;
    return next; return;
  end if;

  if r.profesional_id is null then
    alargada := false; motivo := 'La cita no tiene profesional asignada, no se puede revisar si hay choque.';
    return next; return;
  end if;

  v_dur   := coalesce(r.duracion_min, r.dur_servicio, 60);
  v_fin   := r.fecha_hora + make_interval(mins => v_dur);
  v_nuevo := v_fin + make_interval(mins => p_minutos);

  inicio_local       := to_char(r.fecha_hora at time zone 'America/Bogota', 'HH12:MI AM');
  fin_anterior_local := to_char(v_fin        at time zone 'America/Bogota', 'HH12:MI AM');

  -- Lo primero que estorba entre el fin actual y el fin nuevo: otra cita o un bloqueo
  select x.tipo, x.inicio, x.fin, x.quien, x.detalle
    into k
    from (
      select 'cita'::text as tipo, o.fecha_hora as inicio,
             o.fecha_hora + make_interval(mins => coalesce(o.duracion_min, os.duracion_min, 60)) as fin,
             ocl.nombre as quien, os.nombre as detalle
        from public.citas o
        join public.clientes ocl on ocl.id = o.cliente_id
        left join public.servicios os on os.id = o.servicio_id
       where o.profesional_id = r.profesional_id
         and o.id <> r.id
         and o.estado not in ('cancelada', 'no_asistio')
         and o.fecha_hora < v_nuevo
         and o.fecha_hora + make_interval(mins => coalesce(o.duracion_min, os.duracion_min, 60)) > v_fin
      union all
      select 'bloqueo', b.fecha_inicio, b.fecha_fin,
             case when b.profesional_id is null then 'Bloqueo de todo el salón' else 'Bloqueo de horario' end,
             b.motivo
        from public.bloqueos_horario b
       where (b.profesional_id = r.profesional_id or b.profesional_id is null)
         and b.fecha_inicio < v_nuevo
         and b.fecha_fin > v_fin
    ) x
   order by x.inicio
   limit 1;

  if found then
    alargada := false;
    motivo := case k.tipo when 'cita' then 'Choca con otra cita de la misma profesional.'
                          else 'Choca con un bloqueo de horario.' end;
    choca_con          := k.quien;
    choca_detalle      := k.detalle;
    choca_inicio_local := to_char(k.inicio at time zone 'America/Bogota', 'HH12:MI AM');
    choca_fin_local    := to_char(k.fin    at time zone 'America/Bogota', 'HH12:MI AM');
    minutos_libres     := greatest(0, floor(extract(epoch from (k.inicio - v_fin)) / 60))::integer;
    fin_nuevo_local    := to_char(v_nuevo at time zone 'America/Bogota', 'HH12:MI AM');
    duracion_nueva     := v_dur + p_minutos;
    return next; return;
  end if;

  v_antes   := public.horario_violado(r.profesional_id, r.servicio_id, r.fecha_hora, v_fin);
  v_despues := public.horario_violado(r.profesional_id, r.servicio_id, r.fecha_hora, v_nuevo);

  begin
    perform set_config('app.omitir_horario', 'si', true);
    update public.citas set duracion_min = v_dur + p_minutos where id = r.id;
    perform set_config('app.omitir_horario', '', true);
  exception when others then
    perform set_config('app.omitir_horario', '', true);
    alargada := false; motivo := 'No se pudo alargar: ' || sqlerrm;
    return next; return;
  end;

  alargada        := true;
  fin_nuevo_local := to_char(v_nuevo at time zone 'America/Bogota', 'HH12:MI AM');
  duracion_nueva  := v_dur + p_minutos;
  aviso_horario   := case when v_antes is null then v_despues end;
  return next;
end;
$$;

revoke execute on function public.alargar_cita(uuid, integer) from public, anon, authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (solo si hay que deshacer):
--   drop function if exists public.alargar_cita(uuid, integer);
--   y volver a ejecutar la sección 5 de 20261013000000_horarios_salon.sql (trigger sin la excepción).
