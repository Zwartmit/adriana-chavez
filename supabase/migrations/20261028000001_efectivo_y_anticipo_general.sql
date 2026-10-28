-- Efectivo = sin anticipo + ajuste general del anticipo (28 oct 2026). Idempotente.
--
-- 1. Si la clienta dice que pagará en efectivo en el salón, ya no hay anticipo que validar: avisar_pago_anticipo agenda
--    la cita (pendiente, con la nota "Paga en efectivo en el salón (sin anticipo)"), cierra la solicitud en el estado
--    nuevo 'sin_anticipo' y Adriana recibe el aviso normal "Cita nueva por WhatsApp" (sin botones).
--    Los pagos en efectivo que ya estaban por validar siguen funcionando igual (Recibido / No recibido).
-- 2. Ajuste general del anticipo (configuracion_anticipos.anticipo_general): 'nuevas' (automático: se pide mientras la
--    clienta no tenga citas completadas), 'todas' o 'nadie'. El ajuste propio de cada clienta (anticipo_modo si / no)
--    manda sobre el general. Se cambia desde el panel (Pagos) o por Telegram (admin_anticipo_general).
begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Estado nuevo de la solicitud
-- ──────────────────────────────────────────────────────────────────
alter table public.solicitudes_anticipo drop constraint if exists solicitudes_anticipo_estado_check;
alter table public.solicitudes_anticipo add constraint solicitudes_anticipo_estado_check
  check (estado in ('esperando_pago', 'por_confirmar', 'aprobada', 'rechazada', 'vencida', 'cancelada', 'sin_anticipo'));

-- ──────────────────────────────────────────────────────────────────
-- 2. Ajuste general
-- ──────────────────────────────────────────────────────────────────
alter table public.configuracion_anticipos add column if not exists anticipo_general text not null default 'nuevas';
alter table public.configuracion_anticipos drop constraint if exists configuracion_anticipos_general_valido;
alter table public.configuracion_anticipos add constraint configuracion_anticipos_general_valido
  check (anticipo_general in ('nuevas', 'todas', 'nadie'));
comment on column public.configuracion_anticipos.anticipo_general is 'A quién se le pide anticipo cuando la clienta no tiene ajuste propio: nuevas (sin citas completadas), todas o nadie.';

create or replace function public.requiere_anticipo(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case c.anticipo_modo
           when 'si' then true
           when 'no' then false
           else case (select g.anticipo_general from public.configuracion_anticipos g where g.id = 1)
                  when 'todas' then true
                  when 'nadie' then false
                  else not exists (
                         select 1 from public.citas x
                          where x.cliente_id = c.id and x.estado = 'completada')
                end
         end
    from public.clientes c
   where c.id = p_cliente_id;
$$;
revoke execute on function public.requiere_anticipo(uuid) from public, anon;
grant  execute on function public.requiere_anticipo(uuid) to authenticated;

-- Telegram: consultar o cambiar el ajuste general
create or replace function public.admin_anticipo_general(p_modo text default 'consultar')
returns table (aplicado boolean, error text, modo text, texto text, clientas_con_ajuste_propio integer, ajustes_quitados integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_in     text := lower(btrim(coalesce(p_modo, 'consultar')));
  v_nuevo  text;
  v_actual text;
  v_ajustes integer;
  v_quitados integer := 0;
  v_err    text;
begin
  v_nuevo := case
    when v_in in ('consultar', 'ver', '') then null
    when v_in in ('todas', 'todos', 'siempre', 'si', 'sí') then 'todas'
    when v_in in ('nadie', 'ninguna', 'ninguno', 'nunca', 'no') then 'nadie'
    when v_in in ('nuevas', 'nuevos', 'automatico', 'automático', 'auto') then 'nuevas'
    when v_in in ('quitar_ajustes_propios', 'quitar ajustes propios', 'reiniciar') then 'quitar'
    else 'invalido' end;

  if v_nuevo = 'invalido' then
    v_err := 'El modo debe ser consultar, nuevas, todas, nadie o quitar_ajustes_propios.';
  elsif v_nuevo = 'quitar' then
    update public.clientes set anticipo_modo = null, updated_at = now() where anticipo_modo is not null;
    get diagnostics v_quitados = row_count;
  elsif v_nuevo is not null then
    update public.configuracion_anticipos set anticipo_general = v_nuevo where id = 1;
  end if;

  select g.anticipo_general into v_actual from public.configuracion_anticipos g where g.id = 1;
  select count(*)::integer into v_ajustes from public.clientes c where c.activo and c.anticipo_modo is not null;

  return query select v_err is null, v_err, v_actual,
    case v_actual
      when 'todas' then 'se le pide anticipo a todas las clientas'
      when 'nadie' then 'no se le pide anticipo a nadie'
      else 'se le pide anticipo solo a las clientas nuevas (las que aún no tienen una cita completada)' end,
    v_ajustes, v_quitados;
end;
$$;
revoke execute on function public.admin_anticipo_general(text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 3. La clienta avisa que pagó (transferencia) o que pagará en efectivo (sin anticipo)
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.avisar_pago_anticipo(text, text);
create function public.avisar_pago_anticipo(p_telefono text, p_metodo text default 'transferencia')
returns table (
  ok          boolean,
  error       text,
  solicitud_id bigint,
  ya_avisada  boolean,
  cita_local  text,
  servicio    text,
  profesional text,
  metodo      text,
  texto_calendario text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s        record;
  v_metodo text := case when lower(coalesce(p_metodo, '')) like '%efectivo%' then 'efectivo' else 'transferencia' end;
  v_cita   uuid;
  v_serv   text;
  v_prof   text;
  v_cuando text;
  v_err    text;
begin
  select x.* into s
    from public.solicitudes_anticipo x
    join public.clientes c on c.id = x.cliente_id
   where c.telefono = p_telefono and x.estado = 'esperando_pago'
   limit 1;

  if s.id is null then
    -- ¿Ya había avisado un pago que Adriana está validando?
    select x.* into s
      from public.solicitudes_anticipo x
      join public.clientes c on c.id = x.cliente_id
     where c.telefono = p_telefono and x.estado = 'por_confirmar'
     order by x.comprobante_en desc nulls last, x.id desc
     limit 1;
    if s.id is not null then
      select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
      select p.nombre into v_prof from public.profesionales p where p.id = s.profesional_id;
      return query select true, null::text, s.id, true,
        public.formato_cita_aviso(coalesce((select ci.fecha_hora from public.citas ci where ci.id = s.cita_id), s.inicio),
                                  coalesce((select ci.duracion_min from public.citas ci where ci.id = s.cita_id), s.duracion_total)),
        v_serv, v_prof, s.metodo, null::text;
      return;
    end if;
    -- ¿Ya había dicho que paga en efectivo y su cita quedó agendada sin anticipo?
    select x.* into s
      from public.solicitudes_anticipo x
      join public.clientes c on c.id = x.cliente_id
     where c.telefono = p_telefono and x.estado = 'sin_anticipo' and x.comprobante_en > now() - interval '1 day'
     order by x.id desc
     limit 1;
    if s.id is not null then
      select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
      select p.nombre into v_prof from public.profesionales p where p.id = s.profesional_id;
      return query select true, null::text, s.id, true,
        public.formato_cita_aviso(coalesce((select ci.fecha_hora from public.citas ci where ci.id = s.cita_id), s.inicio),
                                  coalesce((select ci.duracion_min from public.citas ci where ci.id = s.cita_id), s.duracion_total)),
        v_serv, v_prof, 'efectivo'::text, null::text;
      return;
    end if;
    return query select false, 'La clienta no tiene una solicitud de anticipo vigente (puede haber vencido: vuelve a solicitarla con solicitar_anticipo si ella aún quiere la cita).', null::bigint, false, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  select sv.nombre into v_serv from public.servicios sv where sv.id = s.servicio_id;
  select p.nombre into v_prof from public.profesionales p where p.id = s.profesional_id;
  v_cuando := public.formato_cita_aviso(s.inicio, s.duracion_total);

  if s.inicio <= now() then
    return query select false, 'El horario de esa cita ya pasó: no se pudo agendar. Dile a la clienta que Adriana la contacta y llama avisar_adriana.', s.id, false, null::text, null::text, null::text, null::text, null::text;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(s.profesional_id::text));

  -- La cita se crea ahora (pendiente de validar el pago). Si algo falla, el bloque se deshace y el horario sigue apartado.
  begin
    delete from public.bloqueos_horario where id = s.bloqueo_id;
    select r.cita_id into v_cita
      from public.crear_cita_con_adicionales(
             s.cliente_id, s.profesional_id, s.servicio_id, s.inicio, s.duracion_base,
             s.adicional_ids, 'whatsapp', 'pendiente', null) r;
    if v_metodo = 'efectivo' then
      -- Efectivo = sin anticipo: la cita queda agendada (pendiente), sin validar nada. Adriana recibe el aviso normal de "cita nueva".
      update public.citas set notas_internas = 'Paga en efectivo en el salón (sin anticipo)' where id = v_cita;
      update public.avisos_admin
         set mensaje = mensaje || chr(10) || chr(10) || 'La clienta dijo que pagará en efectivo en el salón: no se le pidió anticipo (no hay nada que validar).'
       where cita_id = v_cita and tipo = 'cita_nueva' and enviado_en is null;
      update public.solicitudes_anticipo
         set estado = 'sin_anticipo', metodo = 'efectivo', comprobante_en = now(), cita_id = v_cita, bloqueo_id = null, resuelta_en = now()
       where id = s.id;
    else
      -- El aviso "cita nueva" sobra: el aviso del anticipo ya trae la cita (y nunca se envió, es la misma transacción).
      delete from public.avisos_admin where cita_id = v_cita and tipo = 'cita_nueva' and enviado_en is null;
      update public.citas
         set notas_internas = 'Anticipo por validar: ' || public.formato_pesos(s.monto) || ' (' || v_metodo || ')'
       where id = v_cita;
      update public.solicitudes_anticipo
         set estado = 'por_confirmar', metodo = v_metodo, comprobante_en = now(), cita_id = v_cita, bloqueo_id = null,
             vence_en = s.inicio + make_interval(mins => s.duracion_total) + interval '7 days'
       where id = s.id;
    end if;
  exception when others then
    get stacked diagnostics v_err = message_text;
    return query select false, 'No se pudo agendar la cita (' || v_err || '). Dile a la clienta que Adriana la contacta y llama avisar_adriana.', s.id, false, null::text, null::text, null::text, null::text, null::text;
    return;
  end;

  if v_metodo = 'efectivo' then
    return query select true, null::text, s.id, false, v_cuando, v_serv, v_prof, v_metodo, public.texto_calendario_cita(v_cita);
    return;
  end if;

  insert into public.avisos_admin (tipo, mensaje, solicitud_anticipo_id)
  select 'anticipo',
         'Anticipo por confirmar: ' || coalesce(nullif(btrim(cl.nombre), ''), 'sin nombre registrado')
           || ' (' || s.telefono || ')'
           || chr(10) || 'Cita: ' || coalesce(v_serv, 'Servicio') || ' con ' || coalesce(v_prof, 'profesional')
           || ', ' || v_cuando || ' (ya quedó agendada, pendiente de que valides el pago)'
           || chr(10) || 'Anticipo: ' || public.formato_pesos(s.monto) || ' (' || s.porcentaje || ' % de ' || public.formato_pesos(s.total_desde) || ')'
           || chr(10) || 'Forma de pago: transferencia'
           || chr(10) || 'WhatsApp: https://wa.me/' || regexp_replace(s.telefono, '[^0-9]', '', 'g')
           || chr(10) || chr(10) || 'Cuando puedas, revisa que el pago haya llegado y pulsa el botón Recibido (la cita queda confirmada) o No recibido (se cancela la cita y se libera el horario).',
         s.id
    from public.clientes cl
   where cl.id = s.cliente_id;

  return query select true, null::text, s.id, false, v_cuando, v_serv, v_prof, v_metodo, null::text;
end;
$$;
revoke execute on function public.avisar_pago_anticipo(text, text) from public, anon, authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- REVERSA (solo si hay que deshacer): volver a ejecutar la sección 5 de 20261027000000_anticipo_cita_inmediata.sql
-- (avisar_pago_anticipo anterior) y la función requiere_anticipo de 20261021000003_anticipos.sql, y después:
--   drop function if exists public.admin_anticipo_general(text);
--   alter table public.configuracion_anticipos drop column if exists anticipo_general;
--   (las solicitudes en estado 'sin_anticipo' deben pasarse antes a 'cancelada' para poder quitar el estado de la restricción)
-- ══════════════════════════════════════════════════════════════════
