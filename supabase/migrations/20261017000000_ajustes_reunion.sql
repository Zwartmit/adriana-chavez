-- Ajustes de la reunión con Adriana (17 oct 2026):
--   1. clientes.apodo: nombre con el que el agente de WhatsApp llama a la clienta (opcional).
--   2. servicios.precio_hasta: tope del rango de precio (opcional). servicios.precio sigue siendo el "desde" (obligatorio).
--   3. Recordatorios: la cita de la tarde se recuerda a las 11:00 am (antes 10:00 am) y se usa el apodo si existe.
--   (La "profesional preferida" deja de usarse en panel y agentes; la columna profesional_preferido_id se conserva sin tocar.)
begin;

alter table public.clientes
  add column if not exists apodo text;

alter table public.clientes
  drop constraint if exists clientes_apodo_no_vacio;
alter table public.clientes
  add constraint clientes_apodo_no_vacio check (apodo is null or btrim(apodo) <> '');

alter table public.servicios
  add column if not exists precio_hasta numeric(12,0);

alter table public.servicios
  drop constraint if exists servicios_precio_hasta_valido;
alter table public.servicios
  add constraint servicios_precio_hasta_valido check (precio_hasta is null or precio_hasta >= precio);

comment on column public.clientes.apodo is 'Apodo con el que se llama a la clienta en WhatsApp. Lo registra Adriana (panel o Telegram).';
comment on column public.servicios.precio_hasta is 'Tope opcional del rango de precio. precio es el "desde".';

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
           coalesce(nullif(btrim(cl.apodo), ''), split_part(btrim(cl.nombre), ' ', 1)) as nom,
           case
             when v_hora >= time '18:00' and v_hora < time '20:00'
                  and (c.fecha_hora at time zone 'America/Bogota')::date = v_hoy + 1
                  and (c.fecha_hora at time zone 'America/Bogota')::time < v_alm_ini
               then 'mañana'
             when v_hora >= time '11:00' and v_hora < time '13:00'
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

revoke execute on function public.reclamar_recordatorios(timestamptz) from public, anon, authenticated;

commit;

-- Rollback (aparte):
--   alter table public.servicios drop constraint if exists servicios_precio_hasta_valido; alter table public.servicios drop column if exists precio_hasta;
--   alter table public.clientes drop constraint if exists clientes_apodo_no_vacio; alter table public.clientes drop column if exists apodo;
--   (y volver a crear reclamar_recordatorios desde 20261015000000_recordatorios_citas.sql)
