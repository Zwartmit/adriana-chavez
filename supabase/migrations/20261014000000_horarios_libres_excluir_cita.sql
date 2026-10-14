-- Reprogramar desde el panel (14 oct 2026). REVISAR ANTES DE EJECUTAR.
-- Agrega a horarios_libres un quinto parámetro, p_excluir_cita (por defecto nulo): la cita que se está
-- moviendo no cuenta como ocupada, para que el panel pueda ofrecer, por ejemplo, correr una cita 30 minutos
-- o dejarla a la misma hora con otra profesional. El agente de n8n y el panel de "Nueva cita" siguen llamando
-- la función sin ese parámetro y reciben exactamente lo mismo que antes.
-- Depende de 20261013000002_horarios_libres_incluir_pasadas.sql.

begin;

drop function if exists public.horarios_libres(uuid, date, uuid, boolean);

create or replace function public.horarios_libres(
  p_servicio        uuid,
  p_fecha           date,
  p_profesional     uuid    default null,
  p_incluir_pasadas boolean default false,
  p_excluir_cita    uuid    default null
) returns table (
  profesional_id uuid,
  profesional    text,
  inicio_local   text,
  fin_local      text
)
language sql
stable
security definer
set search_path = ''
as $$
  with srv as (
    select coalesce((select s.duracion_min from public.servicios s where s.id = p_servicio), 60) as dur
  ),
  cand as (
    select p.id as pid, p.nombre, p.orden,
           (p_fecha::timestamp + n * interval '15 minutes') as ini_local
    from public.profesionales p
    cross join generate_series(24, 87) as n
    where p.activo = true
      and (p_profesional is null or p.id = p_profesional)
  ),
  rango as (
    select c.pid, c.nombre, c.orden, c.ini_local,
           (c.ini_local at time zone 'America/Bogota') as ini,
           ((c.ini_local + make_interval(mins => srv.dur)) at time zone 'America/Bogota') as fin,
           srv.dur
    from cand c cross join srv
  )
  select r.pid,
         r.nombre,
         to_char(r.ini_local, 'HH24:MI'),
         to_char(r.ini_local + make_interval(mins => r.dur), 'HH24:MI')
  from rango r
  where (p_incluir_pasadas or r.ini > now())
    and public.horario_violado(r.pid, p_servicio, r.ini, r.fin) is null
    and not exists (
      select 1 from public.citas ci
      where ci.profesional_id = r.pid
        and ci.id is distinct from p_excluir_cita
        and ci.estado not in ('cancelada', 'no_asistio')
        and ci.fecha_hora < r.fin
        and ci.fecha_hora + make_interval(mins => coalesce(ci.duracion_min, 60)) > r.ini
    )
    and not exists (
      select 1 from public.bloqueos_horario b
      where b.profesional_id = r.pid
        and b.fecha_inicio < r.fin
        and b.fecha_fin > r.ini
    )
  order by r.ini_local, r.orden
  limit 600;
$$;

revoke execute on function public.horarios_libres(uuid, date, uuid, boolean, uuid) from public, anon;
grant  execute on function public.horarios_libres(uuid, date, uuid, boolean, uuid) to authenticated;

commit;

-- Rollback (solo si algo falla; ejecutar aparte): vuelve a la versión de cuatro parámetros
--   drop function if exists public.horarios_libres(uuid, date, uuid, boolean, uuid);
--   y ejecutar de nuevo 20261013000002_horarios_libres_incluir_pasadas.sql
