-- Fase E, ajuste de texto (4 nov 2026): el mensaje para quien no tiene acceso (rechazada o desactivada)
-- sonaba seco ("No tienes acceso…"). Solo cambia la frase; la lógica de telegram_acceso es la misma.
--
-- Reversa: volver a ejecutar la sección 4 de 20261029000000_usuarios_telegram.sql.

create or replace function public.telegram_acceso(
  p_chat_id  bigint,
  p_nombre   text    default null,
  p_username text    default null,
  p_es_boton boolean default false,
  p_detalle  text    default null
)
returns table (
  rol            text,
  estado         text,
  profesional_id uuid,
  profesional    text,
  nombre         text,
  mensaje        text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  u     public.usuarios_telegram;
  v_nom text := nullif(btrim(coalesce(p_nombre, '')), '');
  v_usr text := nullif(btrim(coalesce(p_username, '')), '');
  v_prof text;
begin
  if p_chat_id is null then
    return query select null::text, 'inactivo'::text, null::uuid, null::text, null::text, 'No pude identificar este chat.'::text;
    return;
  end if;

  select t.* into u from public.usuarios_telegram t where t.chat_id = p_chat_id;

  -- Primera vez: queda pendiente y a las administradoras les llega un aviso.
  if u.chat_id is null then
    insert into public.usuarios_telegram (chat_id, nombre, username) values (p_chat_id, v_nom, v_usr);
    insert into public.avisos_admin (tipo, mensaje)
    values ('registro_telegram',
      'Alguien quiere usar el asistente de Telegram: ' || coalesce(v_nom, 'sin nombre') || coalesce(' (@' || v_usr || ')', '')
        || ', id ' || p_chat_id || '. Si es una profesional, apruébala diciéndome por ejemplo: "aprueba a '
        || coalesce(v_nom, 'ella') || ' como profesional Yaritza" (con el nombre que tiene en el salón); si es administradora: "aprueba a '
        || coalesce(v_nom, 'ella') || ' como administradora". Para negarle el acceso: "rechaza a ' || coalesce(v_nom, 'ella') || '".');
    return query select null::text, 'pendiente'::text, null::uuid, null::text, v_nom,
      'Hola! Todavía no tienes acceso a este asistente. Ya le avisé a Adriana para que te apruebe; apenas lo haga te escribo por aquí.'::text;
    return;
  end if;

  if (v_nom is not null and v_nom is distinct from u.nombre) or (v_usr is not null and v_usr is distinct from u.username) then
    update public.usuarios_telegram t set nombre = coalesce(v_nom, t.nombre), username = coalesce(v_usr, t.username) where t.chat_id = p_chat_id;
    u.nombre := coalesce(v_nom, u.nombre);
  end if;

  if u.estado = 'activo' then
    select pr.nombre into v_prof from public.profesionales pr where pr.id = u.profesional_id;
    -- Un botón solo lo puede pulsar una administradora.
    if p_es_boton and u.rol <> 'admin' then
      perform public._tg_intento(p_chat_id, u.nombre, 'boton', coalesce(p_detalle, 'botón'));
      return query select u.rol, 'activo'::text, u.profesional_id, v_prof, u.nombre, 'Ese botón es solo para la administradora.'::text;
      return;
    end if;
    return query select u.rol, 'activo'::text, u.profesional_id, v_prof, u.nombre, null::text;
    return;
  end if;

  if u.estado = 'pendiente' then
    return query select null::text, 'pendiente'::text, null::uuid, null::text, u.nombre,
      'Sigo esperando que Adriana apruebe tu acceso. Apenas lo haga te escribo por aquí.'::text;
    return;
  end if;

  -- Rechazada o desactivada
  perform public._tg_intento(p_chat_id, u.nombre, case when p_es_boton then 'boton' else 'mensaje' end,
                             coalesce(p_detalle, 'sin acceso (' || u.estado || ')'));
  return query select null::text, u.estado, null::uuid, null::text, u.nombre,
    'Por ahora no tengo habilitado tu acceso a este asistente. Si crees que es un error, escríbele directamente a Adriana.'::text;
end;
$$;

revoke execute on function public.telegram_acceso(bigint, text, text, boolean, text) from public, anon, authenticated;
