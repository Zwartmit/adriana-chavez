-- Enlace para guardar la cita en el calendario de la clienta (24 oct 2026). Idempotente.
-- El enlace abre /calendario (ruta del sitio) y descarga un archivo .ics con alarma:
--   · cita antes del almuerzo: avisa el día anterior a las 6:00 pm;
--   · cita después del almuerzo: avisa el mismo día a las 11:00 am;
--   · si esa hora de aviso ya pasó cuando se manda el enlace, avisa 1 hora antes.
-- Si el servicio (o un adicional) tiene días de retoque, se agrega un segundo enlace con la fecha del retoque.
-- No lleva datos personales: solo servicio, profesional, hora y duración. No guarda nada.
-- Las funciones solo las ejecutan los flujos de n8n (rol postgres), no el navegador.
begin;

drop function if exists public.texto_calendario_cita(uuid, boolean);

-- Codifica un texto para usarlo dentro de una URL (UTF-8, estilo %C3%A1).
create or replace function public.url_codificar(p_texto text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(string_agg(
           case when ch ~ '^[A-Za-z0-9._~-]$' then ch
                else (select string_agg('%' || upper(substr(q.hx, i, 2)), '' order by i)
                        from (select encode(convert_to(ch, 'UTF8'), 'hex') as hx) q,
                             generate_series(1, length(q.hx), 2) as i)
           end, '' order by n), '')
    from regexp_split_to_table(coalesce(p_texto, ''), '') with ordinality as t(ch, n);
$$;
revoke execute on function public.url_codificar(text) from public, anon, authenticated;

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
  v_base     constant text := 'https://cb-adrianachavez.vercel.app/calendario';
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
revoke execute on function public.texto_calendario_cita(uuid, boolean, timestamptz) from public, anon, authenticated;

-- resolver_anticipo: igual que antes, pero el mensaje de "Recibido" a la clienta agrega el enlace del calendario.
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
    'Listooo 😊 Recibimos tu anticipo, gracias!' || E'\n\n' || 'Tu cita quedó confirmada:' || E'\n\n' || '- ' || coalesce(v_serv, 'servicio') || ' con ' || coalesce(v_prof, 'la profesional') || ', ' || v_cuando || '.'
      || coalesce(E'\n\n' || public.texto_calendario_cita(v_cita), ''),
    v_ventana;
end;
$$;
revoke execute on function public.resolver_anticipo(bigint, text) from public, anon, authenticated;

commit;

-- Reversa (solo quita el enlace del mensaje; vuelve a ejecutar la definición de resolver_anticipo de 20261021000005):
--   drop function if exists public.texto_calendario_cita(uuid, boolean, timestamptz);
--   drop function if exists public.url_codificar(text);
