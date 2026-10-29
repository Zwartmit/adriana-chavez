-- Telegram con roles: quién puede usar el asistente y qué puede hacer (Fase E, 29 oct 2026). Idempotente.
--
-- Hasta hoy el asistente de Telegram solo atendía un chat_id fijo (escrito en n8n en 10 sitios). Ahora:
--   * usuarios_telegram: cada persona que le escribe al bot, con su estado (pendiente, activo, rechazado, inactivo),
--     su rol (admin o profesional) y, si es profesional, a qué profesional del salón corresponde.
--   * Registro: quien no está registrada queda "pendiente" y a las administradoras les llega un aviso; la
--     administradora la aprueba (o la rechaza) escribiéndole al asistente.
--   * telegram_intentos: bitácora de intentos no autorizados (personas sin acceso, botones pulsados por quien no es admin,
--     herramientas de administración llamadas por quien no lo es).
--   * Funciones para las profesionales (prof_*): reciben el chat_id de Telegram, NO un id de profesional, y comprueban
--     en la base que sea una profesional activa; solo ven y tocan lo suyo. Los permisos no dependen del prompt.
--   * avisos_admin.chat_id: destinatario puntual de un aviso (NULL = las administradoras).
-- Para revertir: ver el final del archivo.
begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Tablas
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.usuarios_telegram (
  chat_id        bigint primary key,
  nombre         text,
  username       text,
  rol            text check (rol in ('admin', 'profesional')),
  estado         text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'rechazado', 'inactivo')),
  profesional_id uuid references public.profesionales(id) on delete set null,
  recibe_avisos  boolean not null default true,
  creado_en      timestamptz not null default now(),
  resuelto_en    timestamptz,
  constraint usuarios_telegram_activo_con_rol check (estado <> 'activo' or rol is not null),
  constraint usuarios_telegram_prof_con_profesional check (not (rol = 'profesional' and estado = 'activo' and profesional_id is null))
);
create unique index if not exists usuarios_telegram_profesional_activa_uk
  on public.usuarios_telegram (profesional_id) where estado = 'activo' and profesional_id is not null;

create table if not exists public.telegram_intentos (
  id        bigint generated always as identity primary key,
  chat_id   bigint,
  nombre    text,
  tipo      text not null,
  detalle   text,
  creado_en timestamptz not null default now()
);
create index if not exists telegram_intentos_creado_idx on public.telegram_intentos (creado_en desc);

alter table public.usuarios_telegram enable row level security;
alter table public.telegram_intentos enable row level security;
revoke all on public.usuarios_telegram, public.telegram_intentos from anon, authenticated;
grant select on public.usuarios_telegram, public.telegram_intentos to authenticated;
drop policy if exists "Admin lee usuarios de Telegram" on public.usuarios_telegram;
create policy "Admin lee usuarios de Telegram" on public.usuarios_telegram for select to authenticated using (public.es_admin());
drop policy if exists "Admin lee intentos de Telegram" on public.telegram_intentos;
create policy "Admin lee intentos de Telegram" on public.telegram_intentos for select to authenticated using (public.es_admin());

-- Quien ya usaba el asistente (Brandon) queda como administrador. Adriana se registra escribiéndole al bot y se aprueba por ahí.
insert into public.usuarios_telegram (chat_id, nombre, rol, estado, recibe_avisos, resuelto_en)
values (329143192, 'Brandon', 'admin', 'activo', true, now())
on conflict (chat_id) do nothing;

-- ──────────────────────────────────────────────────────────────────
-- 2. Avisos con destinatario puntual
-- ──────────────────────────────────────────────────────────────────
alter table public.avisos_admin add column if not exists chat_id bigint;
alter table public.avisos_admin drop constraint if exists avisos_admin_tipo_check;
alter table public.avisos_admin add constraint avisos_admin_tipo_check
  check (tipo = any (array['anticipo', 'cita_cancelada', 'cita_nueva', 'cita_reprogramada', 'escalamiento', 'hueco_libre', 'registro_telegram', 'cita_profesional']));

-- ──────────────────────────────────────────────────────────────────
-- 3. Ayudas
-- ──────────────────────────────────────────────────────────────────
-- n8n descarta los parámetros vacíos: los datos "sin valor" llegan como ninguno / ninguna.
create or replace function public._tg_norm(p text)
returns text language sql immutable as $$
  select case when lower(btrim(coalesce(p, ''))) in ('', 'ninguno', 'ninguna', 'ninguno.', 'ninguna.', '-', 'null') then null else btrim(p) end
$$;

-- Profesional (id) asociada a un chat de Telegram activo con rol profesional; NULL si no lo es.
create or replace function public._tg_profesional(p_chat_id bigint)
returns uuid language sql stable security definer set search_path = public as $$
  select u.profesional_id from public.usuarios_telegram u
   where u.chat_id = p_chat_id and u.estado = 'activo' and u.rol = 'profesional' and u.profesional_id is not null
$$;

create or replace function public._tg_intento(p_chat_id bigint, p_nombre text, p_tipo text, p_detalle text)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Sin repetir la misma línea en 10 minutos, para que un bucle no llene la bitácora.
  if exists (select 1 from public.telegram_intentos i
              where i.chat_id is not distinct from p_chat_id and i.tipo = p_tipo and i.detalle is not distinct from p_detalle
                and i.creado_en > now() - interval '10 minutes') then
    return;
  end if;
  insert into public.telegram_intentos (chat_id, nombre, tipo, detalle) values (p_chat_id, p_nombre, p_tipo, left(p_detalle, 300));
end;
$$;

revoke execute on function public._tg_norm(text) from public, anon, authenticated;
revoke execute on function public._tg_profesional(bigint) from public, anon, authenticated;
revoke execute on function public._tg_intento(bigint, text, text, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 4. Acceso: ¿quién escribe y qué puede hacer?  (la llama n8n con el chat de Telegram, nunca el modelo)
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.telegram_acceso(bigint, text, text, boolean, text);
create function public.telegram_acceso(
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
    'No tienes acceso a este asistente. Si crees que es un error, habla con Adriana.'::text;
end;
$$;
revoke execute on function public.telegram_acceso(bigint, text, text, boolean, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 5. Administración de usuarios (herramienta del asistente de la administradora)
--    p_solicitante sale del chat de Telegram (lo pone n8n, no el modelo) y se comprueba aquí otra vez.
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.admin_usuarios_telegram(bigint, text, text, text, text);
create function public.admin_usuarios_telegram(
  p_solicitante bigint,
  p_accion      text,
  p_usuario     text default 'ninguno',
  p_rol         text default 'ninguno',
  p_profesional text default 'ninguna'
)
returns table (
  aplicado      boolean,
  error         text,
  texto         text,
  chat_id       bigint,
  nombre        text,
  rol           text,
  estado        text,
  profesional   text,
  recibe_avisos boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_adm  public.usuarios_telegram;
  u      public.usuarios_telegram;
  v_acc  text := lower(btrim(coalesce(p_accion, '')));
  v_usr  text := public._tg_norm(p_usuario);
  v_rolt text := lower(coalesce(public._tg_norm(p_rol), ''));
  v_prof text := public._tg_norm(p_profesional);
  v_rol  text;
  n      integer;
  v_lista text;
  v_pid  uuid;
  v_pnom text;
  v_etq  text;
begin
  select t.* into v_adm from public.usuarios_telegram t where t.chat_id = p_solicitante and t.estado = 'activo' and t.rol = 'admin';
  if v_adm.chat_id is null then
    perform public._tg_intento(p_solicitante, null, 'herramienta', 'admin_usuarios_telegram: ' || left(v_acc, 40));
    return query select false, 'No tienes permiso para administrar el acceso al asistente.'::text, null::text, null::bigint, null::text, null::text, null::text, null::text, null::boolean;
    return;
  end if;

  if v_acc not in ('listar', 'aprobar', 'rechazar', 'desactivar', 'reactivar', 'avisos_activar', 'avisos_desactivar') then
    return query select false, 'La acción debe ser listar, aprobar, rechazar, desactivar, reactivar, avisos_activar o avisos_desactivar.'::text, null::text, null::bigint, null::text, null::text, null::text, null::text, null::boolean;
    return;
  end if;

  -- ───── Listar ─────
  if v_acc = 'listar' then
    return query
      select true, null::text, null::text, t.chat_id, coalesce(t.nombre, 'sin nombre'), t.rol, t.estado, pr.nombre, t.recibe_avisos
        from public.usuarios_telegram t
        left join public.profesionales pr on pr.id = t.profesional_id
       where v_usr is null
          or (lower(v_usr) in ('pendiente', 'pendientes') and t.estado = 'pendiente')
          or (lower(v_usr) in ('activo', 'activos', 'activa', 'activas') and t.estado = 'activo')
          or (lower(v_usr) not in ('pendiente', 'pendientes', 'activo', 'activos', 'activa', 'activas')
              and (t.nombre ilike '%' || v_usr || '%' or t.username ilike '%' || regexp_replace(v_usr, '^@', '') || '%' or t.chat_id::text = v_usr))
       order by (t.estado = 'pendiente') desc, (t.estado = 'activo') desc, t.rol nulls last, t.nombre;
    if not found then
      return query select true, null::text, 'No hay personas registradas con ese filtro.'::text, null::bigint, null::text, null::text, null::text, null::text, null::boolean;
    end if;
    return;
  end if;

  -- ───── Resolver a quién se refiere ─────
  if v_usr is null then
    return query select false, 'Dime a quién (nombre o id).'::text, null::text, null::bigint, null::text, null::text, null::text, null::text, null::boolean;
    return;
  end if;
  select count(*) into n from public.usuarios_telegram t
   where (v_usr ~ '^-?[0-9]+$' and t.chat_id = v_usr::bigint)
      or (v_usr !~ '^-?[0-9]+$' and (t.nombre ilike '%' || v_usr || '%' or t.username ilike '%' || regexp_replace(v_usr, '^@', '') || '%'));
  if n = 0 then
    return query select false, 'No encontré a esa persona. Tiene que escribirle primero al asistente para quedar registrada.'::text, null::text, null::bigint, null::text, null::text, null::text, null::text, null::boolean;
    return;
  end if;
  if n > 1 then
    select string_agg(coalesce(t.nombre, 'sin nombre') || ' (id ' || t.chat_id || ', ' || t.estado || ')', '; ' order by t.nombre) into v_lista
      from public.usuarios_telegram t
     where t.nombre ilike '%' || v_usr || '%' or t.username ilike '%' || regexp_replace(v_usr, '^@', '') || '%';
    return query select false, ('Hay varias personas con ese nombre: ' || v_lista || '. Dime cuál por su id.')::text, null::text, null::bigint, null::text, null::text, null::text, null::text, null::boolean;
    return;
  end if;
  select t.* into u from public.usuarios_telegram t
   where (v_usr ~ '^-?[0-9]+$' and t.chat_id = v_usr::bigint)
      or (v_usr !~ '^-?[0-9]+$' and (t.nombre ilike '%' || v_usr || '%' or t.username ilike '%' || regexp_replace(v_usr, '^@', '') || '%'));
  v_etq := coalesce(u.nombre, 'esa persona');

  -- ───── Aprobar ─────
  if v_acc = 'aprobar' then
    v_rol := case when v_rolt in ('admin', 'administradora', 'administrador') then 'admin'
                  when v_rolt in ('profesional', 'profesionales') then 'profesional' end;
    if v_rol is null then
      return query select false, 'Dime si la apruebo como administradora o como profesional.'::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    if v_prof is not null then
      select count(*) into n from public.profesionales pr where pr.activo and pr.nombre ilike '%' || v_prof || '%';
      if n = 0 then
        return query select false, ('No encontré una profesional activa que se llame así: ' || v_prof || '.')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
        return;
      end if;
      if n > 1 then
        select string_agg(pr.nombre, ', ' order by pr.nombre) into v_lista from public.profesionales pr where pr.activo and pr.nombre ilike '%' || v_prof || '%';
        return query select false, ('Hay varias profesionales con ese nombre: ' || v_lista || '. Dime cuál.')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
        return;
      end if;
      select pr.id, pr.nombre into v_pid, v_pnom from public.profesionales pr where pr.activo and pr.nombre ilike '%' || v_prof || '%';
    end if;
    if v_rol = 'profesional' and v_pid is null then
      return query select false, 'Para aprobarla como profesional dime cuál profesional del salón es (por ejemplo Yaritza).'::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    if v_pid is not null and exists (select 1 from public.usuarios_telegram t where t.profesional_id = v_pid and t.estado = 'activo' and t.chat_id <> u.chat_id) then
      return query select false, (v_pnom || ' ya está asignada a otra persona del asistente. Desactiva esa primero.')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    update public.usuarios_telegram t
       set rol = v_rol, estado = 'activo', profesional_id = v_pid, resuelto_en = now()
     where t.chat_id = u.chat_id;
    insert into public.avisos_admin (tipo, mensaje, chat_id)
    values ('registro_telegram',
      case when v_rol = 'admin' then 'Listo, ya tienes acceso como administradora. Escríbeme lo que necesites.'
           else 'Listo, ya tienes acceso. Puedo mostrarte tu agenda, bloquear tu horario y marcar si una clienta no llegó. Escríbeme lo que necesites.' end,
      u.chat_id);
    return query select true, null::text,
      ('Listo, ' || v_etq || ' ya puede usar el asistente como ' || case when v_rol = 'admin' then 'administradora' else 'profesional (' || v_pnom || ')' end || '. Le avisé por Telegram.')::text,
      u.chat_id, u.nombre, v_rol, 'activo'::text, v_pnom, u.recibe_avisos;
    return;
  end if;

  -- ───── Rechazar ─────
  if v_acc = 'rechazar' then
    if u.estado = 'activo' then
      return query select false, (v_etq || ' ya tiene acceso. Si quieres quitárselo, pídeme desactivarla.')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    update public.usuarios_telegram t set estado = 'rechazado', resuelto_en = now() where t.chat_id = u.chat_id;
    return query select true, null::text, ('Listo, rechacé a ' || v_etq || '. No podrá usar el asistente.')::text, u.chat_id, u.nombre, u.rol, 'rechazado'::text, null::text, u.recibe_avisos;
    return;
  end if;

  -- ───── Desactivar ─────
  if v_acc = 'desactivar' then
    if u.estado <> 'activo' then
      return query select false, (v_etq || ' no tiene acceso activo (estado: ' || u.estado || ').')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    if u.chat_id = p_solicitante then
      return query select false, 'No puedes quitarte el acceso a ti misma.'::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    if u.rol = 'admin' and (select count(*) from public.usuarios_telegram t where t.estado = 'activo' and t.rol = 'admin') <= 1 then
      return query select false, 'No se puede: es la única administradora activa.'::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    update public.usuarios_telegram t set estado = 'inactivo', resuelto_en = now() where t.chat_id = u.chat_id;
    insert into public.avisos_admin (tipo, mensaje, chat_id) values ('registro_telegram', 'Tu acceso al asistente fue desactivado.', u.chat_id);
    return query select true, null::text, ('Listo, desactivé el acceso de ' || v_etq || '.')::text, u.chat_id, u.nombre, u.rol, 'inactivo'::text, null::text, u.recibe_avisos;
    return;
  end if;

  -- ───── Reactivar ─────
  if v_acc = 'reactivar' then
    if u.estado = 'activo' then
      return query select false, (v_etq || ' ya tiene acceso.')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    if u.rol is null or (u.rol = 'profesional' and u.profesional_id is null) then
      return query select false, (v_etq || ' no tiene rol asignado: apruébala indicando si es administradora o profesional.')::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end if;
    begin
      update public.usuarios_telegram t set estado = 'activo', resuelto_en = now() where t.chat_id = u.chat_id;
    exception when unique_violation then
      return query select false, 'Esa profesional ya está asignada a otra persona del asistente.'::text, null::text, u.chat_id, u.nombre, u.rol, u.estado, null::text, u.recibe_avisos;
      return;
    end;
    insert into public.avisos_admin (tipo, mensaje, chat_id) values ('registro_telegram', 'Tu acceso al asistente fue reactivado.', u.chat_id);
    return query select true, null::text, ('Listo, reactivé el acceso de ' || v_etq || '.')::text, u.chat_id, u.nombre, u.rol, 'activo'::text, null::text, u.recibe_avisos;
    return;
  end if;

  -- ───── Avisos ─────
  update public.usuarios_telegram t set recibe_avisos = (v_acc = 'avisos_activar') where t.chat_id = u.chat_id;
  return query select true, null::text,
    case when v_acc = 'avisos_activar' then ('Listo, ' || v_etq || ' recibirá los avisos del salón.')
         else ('Listo, ' || v_etq || ' ya no recibirá los avisos del salón.') end::text,
    u.chat_id, u.nombre, u.rol, u.estado, null::text, (v_acc = 'avisos_activar');
end;
$$;
revoke execute on function public.admin_usuarios_telegram(bigint, text, text, text, text) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 6. Lo que pueden hacer las profesionales (solo lo suyo; el chat_id lo pone n8n)
-- ──────────────────────────────────────────────────────────────────
-- 6.1 Su agenda entre dos fechas (máximo 14 días): citas y bloqueos, sin teléfonos ni dinero.
drop function if exists public.prof_agenda(bigint, text, text);
create function public.prof_agenda(p_chat_id bigint, p_desde text, p_hasta text)
returns table (error text, tipo text, inicio text, fin text, estado text, cliente text, servicio text, motivo text, id uuid)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_pid  uuid := public._tg_profesional(p_chat_id);
  v_d    date;
  v_h    date;
  v_ini  timestamptz;
  v_fin  timestamptz;
begin
  if v_pid is null then
    return query select 'No tienes permiso para ver esta agenda.'::text, null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::uuid;
    return;
  end if;
  begin v_d := public._tg_norm(p_desde)::date; exception when others then v_d := null; end;
  begin v_h := public._tg_norm(p_hasta)::date; exception when others then v_h := null; end;
  v_d := coalesce(v_d, (now() at time zone 'America/Bogota')::date);
  v_h := coalesce(v_h, v_d);
  if v_h < v_d then v_h := v_d; end if;
  if v_h > v_d + 13 then v_h := v_d + 13; end if;
  v_ini := v_d::timestamp at time zone 'America/Bogota';
  v_fin := (v_h + 1)::timestamp at time zone 'America/Bogota';

  return query
    select null::text, x.tipo, x.inicio, x.fin, x.estado, x.cliente, x.servicio, x.motivo, x.id
      from (
        select c.fecha_hora as orden, 'cita'::text as tipo,
               to_char(c.fecha_hora at time zone 'America/Bogota', 'YYYY-MM-DD HH12:MI AM') as inicio,
               to_char((c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60))) at time zone 'America/Bogota', 'HH12:MI AM') as fin,
               c.estado::text as estado,
               btrim(coalesce(cl.nombre, '') || ' ' || coalesce(cl.apellido, '')) as cliente,
               s.nombre as servicio, null::text as motivo, c.id as id
          from public.citas c
          join public.clientes cl on cl.id = c.cliente_id
          left join public.servicios s on s.id = c.servicio_id
         where c.profesional_id = v_pid
           and c.estado::text not in ('cancelada', 'no_asistio')
           and c.fecha_hora >= v_ini and c.fecha_hora < v_fin
        union all
        select b.fecha_inicio,
               case when exists (select 1 from public.solicitudes_anticipo sa where sa.bloqueo_id = b.id) then 'apartado'
                    when b.profesional_id is null then 'salon'
                    else 'bloqueo' end,
               to_char(b.fecha_inicio at time zone 'America/Bogota', 'YYYY-MM-DD HH12:MI AM'),
               to_char(b.fecha_fin at time zone 'America/Bogota', 'YYYY-MM-DD HH12:MI AM'),
               'bloqueo', null::text, null::text,
               case when exists (select 1 from public.solicitudes_anticipo sa where sa.bloqueo_id = b.id) then 'Horario apartado mientras una clienta paga su anticipo'
                    when b.profesional_id is null then coalesce(nullif(btrim(b.motivo), ''), 'Salón cerrado')
                    else coalesce(nullif(btrim(b.motivo), ''), 'Bloqueo') end,
               b.id
          from public.bloqueos_horario b
         where (b.profesional_id = v_pid or b.profesional_id is null)
           and b.fecha_inicio < v_fin and b.fecha_fin > v_ini
      ) x
     order by x.orden;
end;
$$;

-- 6.2 Bloquear su propio horario. No deja bloquear encima de citas agendadas: eso lo resuelve Adriana.
drop function if exists public.prof_bloquear(bigint, text, text, text);
create function public.prof_bloquear(p_chat_id bigint, p_inicio text, p_fin text, p_motivo text)
returns table (creado boolean, error text, bloqueo_id uuid, inicio_local text, fin_local text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_pid  uuid := public._tg_profesional(p_chat_id);
  v_ini  timestamptz;
  v_fin  timestamptz;
  v_mot  text := left(coalesce(public._tg_norm(p_motivo), 'Bloqueo'), 120);
  v_cit  text;
  v_id   uuid;
begin
  if v_pid is null then
    perform public._tg_intento(p_chat_id, null, 'herramienta', 'prof_bloquear');
    return query select false, 'No tienes permiso para bloquear horarios.'::text, null::uuid, null::text, null::text;
    return;
  end if;
  begin
    v_ini := (btrim(p_inicio)::timestamp) at time zone 'America/Bogota';
    v_fin := (btrim(p_fin)::timestamp) at time zone 'America/Bogota';
  exception when others then
    return query select false, 'No entendí las fechas. Usa el formato AAAA-MM-DD HH:MM, hora de Colombia.'::text, null::uuid, null::text, null::text;
    return;
  end;
  if v_fin <= v_ini then
    return query select false, 'El fin debe ser posterior al inicio.'::text, null::uuid, null::text, null::text;
    return;
  end if;
  if v_fin <= now() then
    return query select false, 'Ese horario ya pasó.'::text, null::uuid, null::text, null::text;
    return;
  end if;
  if v_fin > v_ini + interval '31 days' then
    return query select false, 'Un bloqueo no puede durar más de 31 días. Si necesitas más tiempo, habla con Adriana.'::text, null::uuid, null::text, null::text;
    return;
  end if;

  select string_agg(to_char(c.fecha_hora at time zone 'America/Bogota', 'YYYY-MM-DD HH12:MI AM') || ' ' || coalesce(cl.nombre, 'clienta'), '; ' order by c.fecha_hora)
    into v_cit
    from public.citas c join public.clientes cl on cl.id = c.cliente_id
   where c.profesional_id = v_pid and c.estado::text not in ('cancelada', 'no_asistio')
     and c.fecha_hora < v_fin and c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60)) > v_ini;
  if v_cit is not null then
    return query select false, ('No se puede bloquear: tienes citas en ese horario (' || v_cit || '). Si hay que moverlas o cancelarlas, habla con Adriana.')::text, null::uuid, null::text, null::text;
    return;
  end if;

  begin
    insert into public.bloqueos_horario (profesional_id, fecha_inicio, fecha_fin, motivo, created_by)
    values (v_pid, v_ini, v_fin, v_mot, null)
    returning bloqueos_horario.id into v_id;
  exception when others then
    return query select false, ('No se pudo crear el bloqueo: ' || sqlerrm)::text, null::uuid, null::text, null::text;
    return;
  end;
  return query select true, null::text, v_id,
    to_char(v_ini at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), to_char(v_fin at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI');
end;
$$;

-- 6.3 Quitar un bloqueo suyo (no los del salón ni los horarios apartados por un anticipo pendiente).
drop function if exists public.prof_quitar_bloqueo(bigint, text);
create function public.prof_quitar_bloqueo(p_chat_id bigint, p_bloqueo_id text)
returns table (quitado boolean, error text, inicio_local text, fin_local text, motivo text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_pid uuid := public._tg_profesional(p_chat_id);
  b     public.bloqueos_horario;
  v_id  uuid;
begin
  if v_pid is null then
    perform public._tg_intento(p_chat_id, null, 'herramienta', 'prof_quitar_bloqueo');
    return query select false, 'No tienes permiso para quitar bloqueos.'::text, null::text, null::text, null::text;
    return;
  end if;
  begin v_id := btrim(p_bloqueo_id)::uuid; exception when others then v_id := null; end;
  select x.* into b from public.bloqueos_horario x where x.id = v_id and x.profesional_id = v_pid;
  if b.id is null then
    return query select false, 'No encontré ese bloqueo entre los tuyos.'::text, null::text, null::text, null::text;
    return;
  end if;
  if exists (select 1 from public.solicitudes_anticipo sa where sa.bloqueo_id = b.id) then
    return query select false, 'Ese horario está apartado mientras una clienta paga su anticipo; no se puede quitar desde aquí.'::text, null::text, null::text, null::text;
    return;
  end if;
  if b.fecha_fin <= now() then
    return query select false, 'Ese bloqueo ya pasó.'::text, null::text, null::text, null::text;
    return;
  end if;
  delete from public.bloqueos_horario x where x.id = b.id;
  return query select true, null::text,
    to_char(b.fecha_inicio at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'),
    to_char(b.fecha_fin at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), b.motivo;
end;
$$;

-- 6.4 Marcar que una clienta suya no llegó (solo citas suyas que ya empezaron y siguen abiertas).
drop function if exists public.prof_marcar_no_asistio(bigint, text);
create function public.prof_marcar_no_asistio(p_chat_id bigint, p_cita_id text)
returns table (marcada boolean, cliente text, inicio_local text, motivo text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_pid  uuid := public._tg_profesional(p_chat_id);
  v_id   uuid;
  c      public.citas;
  v_cli  text;
begin
  if v_pid is null then
    perform public._tg_intento(p_chat_id, null, 'herramienta', 'prof_marcar_no_asistio');
    return query select false, null::text, null::text, 'No tienes permiso para marcar inasistencias.'::text;
    return;
  end if;
  begin v_id := btrim(p_cita_id)::uuid; exception when others then v_id := null; end;
  select x.* into c from public.citas x where x.id = v_id and x.profesional_id = v_pid;
  if c.id is null then
    return query select false, null::text, null::text, 'No encontré esa cita entre las tuyas.'::text;
    return;
  end if;
  select cl.nombre into v_cli from public.clientes cl where cl.id = c.cliente_id;
  if c.fecha_hora >= now() then
    return query select false, v_cli, to_char(c.fecha_hora at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), 'La cita todavía no ha empezado.'::text;
    return;
  end if;
  if c.estado::text not in ('pendiente', 'confirmada', 'en_proceso') then
    return query select false, v_cli, to_char(c.fecha_hora at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'),
      'Esa cita está en estado ' || c.estado::text || ', así que no la puedo marcar. Si hace falta, habla con Adriana.'::text;
    return;
  end if;
  update public.citas x set estado = 'no_asistio' where x.id = c.id;
  return query select true, v_cli, to_char(c.fecha_hora at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), null::text;
end;
$$;

revoke execute on function public.prof_agenda(bigint, text, text) from public, anon, authenticated;
revoke execute on function public.prof_bloquear(bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public.prof_quitar_bloqueo(bigint, text) from public, anon, authenticated;
revoke execute on function public.prof_marcar_no_asistio(bigint, text) from public, anon, authenticated;

commit;

-- ──────────────────────────────────────────────────────────────────
-- Para revertir (solo si hiciera falta; borra los registros de usuarios y la bitácora):
--   drop function if exists public.prof_marcar_no_asistio(bigint, text), public.prof_quitar_bloqueo(bigint, text),
--     public.prof_bloquear(bigint, text, text, text), public.prof_agenda(bigint, text, text),
--     public.admin_usuarios_telegram(bigint, text, text, text, text), public.telegram_acceso(bigint, text, text, boolean, text),
--     public._tg_intento(bigint, text, text, text), public._tg_profesional(bigint), public._tg_norm(text);
--   drop table if exists public.telegram_intentos, public.usuarios_telegram;
--   delete from public.avisos_admin where tipo in ('registro_telegram', 'cita_profesional');
--   alter table public.avisos_admin drop column if exists chat_id;
--   alter table public.avisos_admin drop constraint avisos_admin_tipo_check;
--   alter table public.avisos_admin add constraint avisos_admin_tipo_check
--     check (tipo = any (array['anticipo','cita_cancelada','cita_nueva','cita_reprogramada','escalamiento','hueco_libre']));
