-- Aviso a cada profesional cuando cambia una cita SUYA (Fase E, 29 oct 2026). Idempotente.
--
-- Cuando una cita futura se agenda, se cancela, se mueve o pasa a otra profesional, a la profesional afectada
-- le llega un mensaje por Telegram (si tiene acceso activo y recibe_avisos). El texto trae solo lo que necesita
-- para su agenda: clienta (nombre y apellido), servicio y horario. Nunca teléfonos ni dinero.
-- Se guarda como un aviso con destinatario (avisos_admin.chat_id) y lo entrega el flujo AC-Admin-Cola.
-- Si la profesional no está registrada en Telegram, no se crea ningún aviso.
begin;

create or replace function public._tg_chat_profesional(p_profesional uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select u.chat_id from public.usuarios_telegram u
   where u.profesional_id = p_profesional and u.estado = 'activo' and u.rol = 'profesional' and u.recibe_avisos
$$;

create or replace function public.avisar_profesional_cita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cli   text;
  v_serv  text;
  v_chat  bigint;
  v_cerr  text[] := array['cancelada', 'no_asistio', 'completada'];
begin
  -- Solo citas futuras: lo pasado no necesita aviso.
  if tg_op = 'INSERT' then
    if new.profesional_id is null or new.fecha_hora <= now() or new.estado::text = any (v_cerr) then
      return null;
    end if;
  else
    if old.fecha_hora <= now() and new.fecha_hora <= now() then
      return null;
    end if;
  end if;

  select btrim(coalesce(c.nombre, '') || ' ' || coalesce(c.apellido, '')) into v_cli from public.clientes c where c.id = new.cliente_id;
  select s.nombre into v_serv from public.servicios s where s.id = new.servicio_id;
  v_cli  := coalesce(nullif(v_cli, ''), 'una clienta');
  v_serv := coalesce(v_serv, 'servicio');

  if tg_op = 'INSERT' then
    v_chat := public._tg_chat_profesional(new.profesional_id);
    if v_chat is not null then
      insert into public.avisos_admin (tipo, cita_id, mensaje, chat_id)
      values ('cita_profesional', new.id,
              'Cita nueva en tu agenda: ' || v_cli || ', ' || v_serv || ', ' || public.formato_cita_aviso(new.fecha_hora, new.duracion_min) || '.', v_chat);
    end if;
    return null;
  end if;

  -- Cancelada
  if new.estado::text = 'cancelada' and old.estado::text <> 'cancelada' and old.profesional_id is not null then
    v_chat := public._tg_chat_profesional(old.profesional_id);
    if v_chat is not null and old.fecha_hora > now() then
      insert into public.avisos_admin (tipo, cita_id, mensaje, chat_id)
      values ('cita_profesional', new.id,
              'Se canceló una cita tuya: ' || v_cli || ', ' || v_serv || ', ' || public.formato_cita_aviso(old.fecha_hora, old.duracion_min) || '.', v_chat);
    end if;
    return null;
  end if;

  -- Una cita que ya estaba cerrada y sigue cerrada no avisa
  if new.estado::text = any (v_cerr) then
    return null;
  end if;

  -- Pasa a otra profesional
  if new.profesional_id is distinct from old.profesional_id then
    if old.profesional_id is not null and old.fecha_hora > now() then
      v_chat := public._tg_chat_profesional(old.profesional_id);
      if v_chat is not null then
        insert into public.avisos_admin (tipo, cita_id, mensaje, chat_id)
        values ('cita_profesional', new.id,
                'Ya no tienes esta cita: ' || v_cli || ', ' || v_serv || ', ' || public.formato_cita_aviso(old.fecha_hora, old.duracion_min) || '.', v_chat);
      end if;
    end if;
    if new.profesional_id is not null and new.fecha_hora > now() then
      v_chat := public._tg_chat_profesional(new.profesional_id);
      if v_chat is not null then
        insert into public.avisos_admin (tipo, cita_id, mensaje, chat_id)
        values ('cita_profesional', new.id,
                'Cita nueva en tu agenda: ' || v_cli || ', ' || v_serv || ', ' || public.formato_cita_aviso(new.fecha_hora, new.duracion_min) || '.', v_chat);
      end if;
    end if;
    return null;
  end if;

  -- Se movió de horario con la misma profesional
  if new.fecha_hora is distinct from old.fecha_hora and new.profesional_id is not null and new.fecha_hora > now() then
    v_chat := public._tg_chat_profesional(new.profesional_id);
    if v_chat is not null then
      insert into public.avisos_admin (tipo, cita_id, mensaje, chat_id)
      values ('cita_profesional', new.id,
              'Se movió una cita tuya: ' || v_cli || ', ' || v_serv || '. Antes: ' || public.formato_cita_aviso(old.fecha_hora, old.duracion_min)
                || '. Ahora: ' || public.formato_cita_aviso(new.fecha_hora, new.duracion_min) || '.', v_chat);
    end if;
  end if;
  return null;
end;
$$;

revoke execute on function public._tg_chat_profesional(uuid) from public, anon, authenticated;
revoke execute on function public.avisar_profesional_cita() from public, anon, authenticated;

drop trigger if exists trg_avisar_profesional_cita on public.citas;
create trigger trg_avisar_profesional_cita
  after insert or update of fecha_hora, estado, profesional_id on public.citas
  for each row execute function public.avisar_profesional_cita();

commit;

-- Para revertir:
--   drop trigger if exists trg_avisar_profesional_cita on public.citas;
--   drop function if exists public.avisar_profesional_cita(), public._tg_chat_profesional(uuid);
--   delete from public.avisos_admin where tipo = 'cita_profesional';  -- (solo si luego se revierte también la migración 20261029000000)
