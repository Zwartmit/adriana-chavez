-- Recordatorios de cita por WhatsApp (plantilla Utility), según la regla de Adriana (15 oct 2026):
--   · 6:00 pm del día anterior: citas de mañana que empiezan antes del almuerzo.
--   · 10:00 am del mismo día: citas de hoy que empiezan después del almuerzo.
-- Reutiliza la bandera existente citas.recordatorio_24h_enviado (el panel ya la reinicia al reprogramar).
-- La función RESERVA las citas (update atómico) y devuelve lo necesario para enviar la plantilla.
-- Ventanas: 18:00 a 20:00 (noche anterior) y 10:00 a 12:00 (mismo día); si n8n se cae fuera de la ventana no se manda tarde.
-- Se omiten las citas creadas hace menos de 3 horas, las canceladas y las de clientas sin teléfono.
begin;

create or replace function public.reclamar_recordatorios(p_ahora timestamptz default now())
returns table (
  cita_id  uuid,
  telefono text,
  nombre   text,
  momento  text,   -- 'mañana' o 'esta tarde'
  servicio text,
  hora     text    -- 'las 11:00 am' / 'la 1:00 pm'
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_hoy   date := (p_ahora at time zone 'America/Bogota')::date;
  v_hora  time := (p_ahora at time zone 'America/Bogota')::time;
  v_alm_ini time;
  v_alm_fin time;
begin
  select cfg.almuerzo_inicio, cfg.almuerzo_fin
    into v_alm_ini, v_alm_fin
    from public.configuracion_horario cfg
   where cfg.id = 1;
  if v_alm_ini is null then
    v_alm_ini := time '13:00';
    v_alm_fin := time '14:00';
  end if;

  return query
  with cand as (
    select c.id as cid,
           cl.telefono as tel,
           split_part(btrim(cl.nombre), ' ', 1) as nom,
           case
             when v_hora >= time '18:00' and v_hora < time '20:00'
                  and (c.fecha_hora at time zone 'America/Bogota')::date = v_hoy + 1
                  and (c.fecha_hora at time zone 'America/Bogota')::time < v_alm_ini
               then 'mañana'
             when v_hora >= time '10:00' and v_hora < time '12:00'
                  and (c.fecha_hora at time zone 'America/Bogota')::date = v_hoy
                  and (c.fecha_hora at time zone 'America/Bogota')::time >= v_alm_fin
               then 'esta tarde'
           end as mom,
           coalesce(s.nombre, 'Cita') as serv,
           (c.fecha_hora at time zone 'America/Bogota') as local_cita
      from public.citas c
      join public.clientes cl on cl.id = c.cliente_id
      left join public.servicios s on s.id = c.servicio_id
     where c.estado in ('pendiente', 'confirmada')
       and coalesce(c.recordatorio_24h_enviado, false) = false
       and c.created_at <= p_ahora - interval '3 hours'
       and cl.telefono is not null and btrim(cl.telefono) <> ''
  ),
  elegidas as (
    select * from cand where mom is not null
  ),
  reservadas as (
    update public.citas c
       set recordatorio_24h_enviado = true
      from elegidas e
     where c.id = e.cid
       and coalesce(c.recordatorio_24h_enviado, false) = false
    returning c.id as rid
  )
  select e.cid, e.tel, e.nom, e.mom, e.serv,
         (case when extract(hour from e.local_cita)::int % 12 = 1 then 'la ' else 'las ' end)
           || to_char(e.local_cita, 'FMHH12:MI') || ' '
           || (case when extract(hour from e.local_cita) < 12 then 'am' else 'pm' end)
    from elegidas e
    join reservadas r on r.rid = e.cid
   order by e.local_cita;
end;
$$;

-- Solo n8n (rol postgres) la ejecuta; la API pública no.
revoke execute on function public.reclamar_recordatorios(timestamptz) from public, anon, authenticated;

commit;

-- Rollback (aparte): drop function if exists public.reclamar_recordatorios(timestamptz);
-- OJO: la función MARCA las citas como recordadas al ejecutarla. Para probarla en la base real, usa una cita de prueba
-- con created_at anterior a hace 3 horas, y para repetir la prueba: update public.citas set recordatorio_24h_enviado = false where id = '<id>';
