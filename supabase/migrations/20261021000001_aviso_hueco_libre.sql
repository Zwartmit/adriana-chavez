-- Aviso a Adriana de los huecos que se abren en la agenda (21 oct 2026). Idempotente.
-- Cuando se cancela una cita futura, queda un espacio libre con esa profesional. La función
-- avisar_huecos_libres() busca las clientas de esa misma profesional con cita en los 3 días
-- siguientes cuyo servicio cabe en ese hueco (respetando citas, bloqueos y reglas de horario)
-- y deja un aviso en la cola de Telegram (avisos_admin) con el enlace de WhatsApp de cada una.
-- Adriana decide a quién escribirle y mueve la cita desde el panel. Un flujo de n8n llama a la
-- función cada 10 minutos. Solo avisa entre las 7:00 am y las 9:00 pm (hora de Colombia) y solo
-- de huecos que empiezan dentro de más de 3 horas.
-- Al crear la columna, las citas ya canceladas se marcan como avisadas (no se avisa de huecos viejos).
begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'citas' and column_name = 'hueco_avisado_en'
  ) then
    alter table public.citas add column hueco_avisado_en timestamptz;
    update public.citas set hueco_avisado_en = now() where estado = 'cancelada';
  end if;
end;
$$;

comment on column public.citas.hueco_avisado_en is 'Cuándo se avisó a Adriana del hueco que dejó esta cita al cancelarse (para no repetir el aviso).';

-- El aviso es un tipo nuevo de la cola: se amplía la restricción conservando los tipos que ya existan.
do $$
declare
  r record;
  v_tipos text;
begin
  select string_agg(quote_literal(t), ', ' order by t) into v_tipos
    from (
      select distinct tipo as t from public.avisos_admin
      union
      select unnest(array['cita_nueva', 'cita_cancelada', 'cita_reprogramada', 'escalamiento', 'hueco_libre'])
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

create or replace function public.avisar_huecos_libres(p_ahora timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dias   text[] := array['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  v_meses  text[] := array['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  v_hora   time := (p_ahora at time zone 'America/Bogota')::time;
  v_total  integer := 0;
  h        record;
  v_fecha  date;
  v_lineas text;
  v_n      integer;
  v_msg    text;
begin
  if v_hora < time '07:00' or v_hora >= time '21:00' then
    return 0;
  end if;

  for h in
    select c.id, c.cliente_id, c.profesional_id, c.fecha_hora,
           coalesce(c.duracion_min, 60) as dur,
           p.nombre as profesional
      from public.citas c
      join public.profesionales p on p.id = c.profesional_id
     where c.estado = 'cancelada'
       and c.hueco_avisado_en is null
       and c.profesional_id is not null
       and c.updated_at >= p_ahora - interval '2 days'
     order by c.fecha_hora, c.id
     for update of c skip locked
  loop
    update public.citas set hueco_avisado_en = p_ahora where id = h.id;

    if h.fecha_hora < p_ahora + interval '3 hours' then
      continue;
    end if;

    v_fecha := (h.fecha_hora at time zone 'America/Bogota')::date;

    select count(*),
           string_agg(
             '- ' || q.nombre
               || ': ' || q.servicio || ', '
               || v_dias[extract(isodow from (q.fecha_hora at time zone 'America/Bogota'))::int] || ' '
               || extract(day from (q.fecha_hora at time zone 'America/Bogota'))::int || ' de '
               || v_meses[extract(month from (q.fecha_hora at time zone 'America/Bogota'))::int]
               || ' a las ' || lower(to_char(q.fecha_hora at time zone 'America/Bogota', 'FMHH12:MI AM'))
               || chr(10) || '  WhatsApp: https://wa.me/' || q.tel,
             chr(10) order by q.fecha_hora, q.cita_id)
      into v_n, v_lineas
      from (
        select * from (
          select distinct on (c2.cliente_id)
                 c2.id as cita_id,
                 c2.fecha_hora,
                 trim(cl.nombre || ' ' || coalesce(cl.apellido, '')) || coalesce(' (' || nullif(btrim(cl.apodo), '') || ')', '') as nombre,
                 s.nombre as servicio,
                 case when length(regexp_replace(cl.telefono, '[^0-9]', '', 'g')) = 10
                      then '57' || regexp_replace(cl.telefono, '[^0-9]', '', 'g')
                      else regexp_replace(cl.telefono, '[^0-9]', '', 'g') end as tel
            from public.citas c2
            join public.clientes cl on cl.id = c2.cliente_id
            join public.servicios s on s.id = c2.servicio_id
           where c2.profesional_id = h.profesional_id
             and c2.estado in ('pendiente', 'confirmada')
             and c2.cliente_id <> h.cliente_id
             and (c2.fecha_hora at time zone 'America/Bogota')::date between v_fecha + 1 and v_fecha + 3
             and regexp_replace(coalesce(cl.telefono, ''), '[^0-9]', '', 'g') <> ''
             and not exists (
                   select 1 from public.citas o
                    where o.profesional_id = h.profesional_id
                      and o.id <> c2.id
                      and o.estado not in ('cancelada', 'no_asistio')
                      and h.fecha_hora < o.fecha_hora + make_interval(mins => coalesce(o.duracion_min, 60))
                      and h.fecha_hora + make_interval(mins => coalesce(c2.duracion_min, 60)) > o.fecha_hora)
             and not exists (
                   select 1 from public.bloqueos_horario b
                    where (b.profesional_id = h.profesional_id or b.profesional_id is null)
                      and h.fecha_hora < b.fecha_fin
                      and h.fecha_hora + make_interval(mins => coalesce(c2.duracion_min, 60)) > b.fecha_inicio)
             and public.horario_violado(h.profesional_id, c2.servicio_id, h.fecha_hora,
                                        h.fecha_hora + make_interval(mins => coalesce(c2.duracion_min, 60))) is null
           order by c2.cliente_id, c2.fecha_hora, c2.id
        ) uno
        order by uno.fecha_hora, uno.cita_id
        limit 8
      ) q;

    if coalesce(v_n, 0) = 0 then
      continue;
    end if;

    v_msg := 'Se liberó un espacio con ' || h.profesional || ': '
          || v_dias[extract(isodow from (h.fecha_hora at time zone 'America/Bogota'))::int] || ' '
          || extract(day from (h.fecha_hora at time zone 'America/Bogota'))::int || ' de '
          || v_meses[extract(month from (h.fecha_hora at time zone 'America/Bogota'))::int]
          || ', de ' || lower(to_char(h.fecha_hora at time zone 'America/Bogota', 'FMHH12:MI AM'))
          || ' a ' || lower(to_char((h.fecha_hora + make_interval(mins => h.dur)) at time zone 'America/Bogota', 'FMHH12:MI AM'))
          || chr(10) || chr(10)
          || 'Clientas de ' || h.profesional || ' con cita en los próximos días que lo podrían tomar:'
          || chr(10) || v_lineas
          || chr(10) || chr(10)
          || 'Si alguna acepta, muévele la cita desde el panel (Reprogramar)';

    insert into public.avisos_admin (tipo, cita_id, mensaje) values ('hueco_libre', h.id, v_msg);
    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;

revoke execute on function public.avisar_huecos_libres(timestamptz) from public, anon, authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (solo si hay que deshacer):
--   drop function if exists public.avisar_huecos_libres(timestamptz);
--   delete from public.avisos_admin where tipo = 'hueco_libre';
--   alter table public.citas drop column if exists hueco_avisado_en;
--   (la restricción avisos_admin_tipo_check puede quedarse con el tipo extra)
