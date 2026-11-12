-- 12 nov 2026: la web pasa a su dominio propio (cb-adrianachavez.com, en Netlify).
-- Solo cambia la dirección base de los enlaces de calendario; el resto de la función es idéntico a la de 20261024000000_enlace_calendario.sql.
-- Reversa: volver a ejecutar esa migración (deja v_base en https://cb-adrianachavez.vercel.app/calendario).

-- Texto listo para pegar al final del mensaje de confirmación: invitación + enlace de la cita
-- y, si aplica, el enlace del retoque. Devuelve null si la cita no existe o no está activa.
-- p_inicio: fecha y hora a usar en vez de la guardada; sirve cuando la cita se mueve en la misma consulta
-- (la función es volátil a propósito: así ve la cita recién creada en la misma consulta).
create or replace function public.texto_calendario_cita(p_cita_id uuid, p_reprogramada boolean default false, p_inicio timestamptz default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c          record;
  v_base     constant text := 'https://cb-adrianachavez.com/calendario';
  v_ini      timestamp;
  v_alm_ini  time;
  v_alarma   timestamp;
  v_min      int;
  v_dias     int;
  v_enlace   text;
  v_retoque  text;
  v_texto    text;
begin
  select ci.fecha_hora, ci.duracion_min, ci.estado,
         coalesce(nullif(btrim(s.nombre), ''), 'Tu cita') as servicio,
         nullif(btrim(p.nombre), '') as profesional,
         ci.id, ci.servicio_id
    into c
    from public.citas ci
    left join public.servicios s on s.id = ci.servicio_id
    left join public.profesionales p on p.id = ci.profesional_id
   where ci.id = p_cita_id;
  if c.id is null or c.estado not in ('pendiente', 'confirmada') then
    return null;
  end if;

  select cfg.almuerzo_inicio into v_alm_ini from public.configuracion_horario cfg where cfg.id = 1;
  v_alm_ini := coalesce(v_alm_ini, time '13:00');

  v_ini := coalesce(p_inicio, c.fecha_hora) at time zone 'America/Bogota';
  if v_ini::time < v_alm_ini then
    v_alarma := (v_ini::date - 1) + time '18:00';
  else
    v_alarma := v_ini::date + time '11:00';
  end if;
  if v_alarma <= (now() at time zone 'America/Bogota') then
    v_min := 60;
  else
    v_min := round(extract(epoch from (v_ini - v_alarma)) / 60)::int;
  end if;

  v_enlace := v_base
    || '?s=' || to_char(v_ini, 'YYYYMMDD"T"HH24MI')
    || '&m=' || coalesce(c.duracion_min, 60)
    || '&x=' || public.url_codificar(c.servicio)
    || case when c.profesional is not null then '&p=' || public.url_codificar(c.profesional) else '' end
    || '&a=' || v_min;

  v_texto := case when p_reprogramada
      then 'Si gustas, guarda la nueva fecha en el calendario de tu celular para que no se te olvide y llegues a tiempo 📅 (si ya tenías la anterior, bórrala)' || E'\n' || v_enlace
      else 'Si gustas, guarda tu cita en el calendario de tu celular para que no se te olvide y llegues a tiempo 📅' || E'\n' || v_enlace
    end;

  -- Retoque: el menor de los días del servicio y de sus adicionales (igual que el aviso a Adriana).
  select min(x.dias) into v_dias
    from (select sv.dias_retoque as dias from public.servicios sv where sv.id = c.servicio_id
          union all
          select a.dias_retoque
            from public.cita_adicionales ca
            join public.adicionales a on a.id = ca.adicional_id
           where ca.cita_id = c.id) x;
  if v_dias is not null then
    v_retoque := v_base
      || '?t=retoque'
      || '&d=' || to_char(v_ini::date + v_dias, 'YYYYMMDD')
      || '&x=' || public.url_codificar(c.servicio);
    v_texto := v_texto || E'\n\n'
      || 'Y este otro te recuerda tu retoque, que te toca hacia el ' || to_char(v_ini::date + v_dias, 'DD/MM') || ' ✨' || E'\n' || v_retoque;
  end if;

  return v_texto;
end;
$$;

-- Comprobación: debe devolver true.
-- select pg_get_functiondef('public.texto_calendario_cita(uuid, boolean, timestamptz)'::regprocedure) like '%https://cb-adrianachavez.com/calendario%';
