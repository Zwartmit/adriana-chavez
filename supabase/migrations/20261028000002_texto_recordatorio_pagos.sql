-- Texto del resumen del recordatorio de pagos (28 oct 2026). Idempotente.
--
-- El resumen decía "te los reenvío abajo", pero en Telegram llega después de los avisos con botones.
-- Ahora el texto no depende del orden en que lleguen los mensajes.
begin;

CREATE OR REPLACE FUNCTION public.recordatorio_pagos_pendientes()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    case when n = 1 then 'Tienes 1 pago por validar. Va con sus botones: pulsa Recibido si ya te llegó o No recibido si no.'
         else 'Tienes ' || n || ' pagos por validar. Cada uno va con sus botones: pulsa Recibido si ya te llegó o No recibido si no.' end);

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
$function$;

commit;
