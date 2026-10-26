-- Texto del aviso de anticipo en Telegram: coincide con lo que dice el bot (se confirma con los botones Recibido / No recibido).
-- Solo cambia el texto; la lógica de la función es la misma.
begin;

create or replace function public.avisar_pago_anticipo(p_telefono text, p_metodo text default 'transferencia')
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
                                       then 'Cuando tengas el efectivo, pulsa el botón Recibido (se agenda la cita). Si no lo paga, pulsa No recibido y se libera el horario.'
                                       else 'Revisa que el pago haya llegado y pulsa el botón Recibido (se agenda la cita) o No recibido (no se agenda).' end,
         s.id
    from public.clientes cl
    left join public.servicios sv on sv.id = s.servicio_id
    left join public.profesionales p on p.id = s.profesional_id
   where cl.id = s.cliente_id;

  return query select true, null::text, s.id, false;
end;
$$;
revoke execute on function public.avisar_pago_anticipo(text, text) from public, anon, authenticated;

commit;
