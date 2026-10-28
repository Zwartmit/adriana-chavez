-- Horas de los avisos programados de Telegram, editables desde el panel y desde Telegram (27 oct 2026). Idempotente.
--
-- Hasta ahora cada aviso de AC-Admin-Avisos tenía su hora fija dentro del disparador de n8n. Ahora la hora vive en la base:
--   · Los disparadores de n8n corren cada 15 minutos y le preguntan a la base si ya es la hora de su aviso (toca_aviso).
--   · La base responde que sí una sola vez por día y por hora (no repite) y con una tolerancia de 2 horas por si n8n estuvo apagado.
--   · Las horas se cambian con guardar_horarios_aviso (panel: Avisos) o admin_horarios_avisos (Telegram). Pasos de 15 minutos.
-- Avisos: resumen (7:00), inventario (8:00), pagos por validar (10:00 y 16:00), revisión de citas (6:30 p. m.), cierre del día (7:00 p. m.).
-- Los avisos "huecos" (cada 10 minutos) no entran aquí: no tienen hora.
begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Tablas
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.avisos_programados (
  aviso          text primary key,
  nombre         text not null,
  descripcion    text not null,
  permite_varias boolean not null default false,
  orden          integer not null default 0,
  activo         boolean not null default true
);
comment on table public.avisos_programados is 'Avisos de Telegram que se envían a una hora del día (catálogo). Las horas están en horarios_avisos.';

create table if not exists public.horarios_avisos (
  id               bigint generated always as identity primary key,
  aviso            text not null references public.avisos_programados(aviso) on delete cascade,
  hora             time not null,
  ultima_ejecucion date,
  constraint horarios_avisos_hora_valida check (extract(second from hora) = 0 and (extract(minute from hora))::int % 15 = 0),
  constraint horarios_avisos_unico unique (aviso, hora)
);
comment on table public.horarios_avisos is 'Hora local (Bogotá) de cada aviso programado. ultima_ejecucion = fecha en que ya salió (evita repetirlo).';

-- Si la hora que se acaba de poner ya pasó hoy, el aviso sale mañana (no se dispara de inmediato al editarla).
create or replace function public.trg_horarios_avisos_hoy()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.hora is distinct from old.hora then
    if (now() at time zone 'America/Bogota')::time >= new.hora then
      new.ultima_ejecucion := (now() at time zone 'America/Bogota')::date;
    else
      new.ultima_ejecucion := null;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists horarios_avisos_hoy on public.horarios_avisos;
create trigger horarios_avisos_hoy
  before insert or update of hora on public.horarios_avisos
  for each row execute function public.trg_horarios_avisos_hoy();

-- Valores iniciales (los que tenían los disparadores de n8n). Solo se crean si todavía no hay nada.
insert into public.avisos_programados (aviso, nombre, descripcion, permite_varias, orden) values
  ('resumen',    'Resumen de la mañana', 'Las citas del día y los retoques por avisar', false, 1),
  ('inventario', 'Alerta de inventario', 'Los productos agotados', false, 2),
  ('pagos',      'Pagos por validar',    'Reenvía con sus botones los anticipos que todavía no has validado', true, 3),
  ('revision',   'Revisión de citas',    'Te muestra las citas de hoy que ya empezaron para que avises quién no asistió (antes del cierre)', false, 4),
  ('cierre',     'Cierre del día',       'Completa las citas de hoy y manda los totales del día', false, 5)
on conflict (aviso) do nothing;

insert into public.horarios_avisos (aviso, hora)
select v.aviso, v.hora
  from (values ('resumen', time '07:00'), ('inventario', time '08:00'), ('pagos', time '10:00'), ('pagos', time '16:00'),
               ('revision', time '18:30'), ('cierre', time '19:00')) as v(aviso, hora)
 where not exists (select 1 from public.horarios_avisos h where h.aviso = v.aviso);

-- Permisos: el panel lee; escribir solo con las funciones de abajo.
alter table public.avisos_programados enable row level security;
alter table public.horarios_avisos enable row level security;
revoke all on public.avisos_programados, public.horarios_avisos from anon, authenticated;
drop policy if exists "Admin lee avisos programados" on public.avisos_programados;
create policy "Admin lee avisos programados" on public.avisos_programados for select to authenticated using (public.es_admin());
drop policy if exists "Admin lee horarios de avisos" on public.horarios_avisos;
create policy "Admin lee horarios de avisos" on public.horarios_avisos for select to authenticated using (public.es_admin());
grant select on public.avisos_programados, public.horarios_avisos to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 2. Ayudantes de formato
-- ──────────────────────────────────────────────────────────────────
-- "7:30 pm", "19:30", "7", "7am" -> time (null si no es válida o no cae en pasos de 15 minutos)
create or replace function public.parse_hora_aviso(p_texto text)
returns time
language plpgsql
immutable
set search_path = public
as $$
declare
  v_t  text := regexp_replace(lower(btrim(coalesce(p_texto, ''))), '[\s\.]', '', 'g');
  m    text[];
  v_h  integer;
  v_mi integer;
begin
  m := regexp_match(v_t, '^(\d{1,2})(?::(\d{2}))?(am|pm)?$');
  if m is null then return null; end if;
  v_h := m[1]::integer;
  v_mi := coalesce(m[2], '0')::integer;
  if m[3] is not null then
    if v_h < 1 or v_h > 12 then return null; end if;
    v_h := case when m[3] = 'am' then v_h % 12 else (v_h % 12) + 12 end;
  end if;
  if v_h > 23 or v_mi > 59 or v_mi % 15 <> 0 then return null; end if;
  return make_time(v_h, v_mi, 0);
end;
$$;

-- 19:30 -> "7:30 p. m."
create or replace function public.hora_texto(p_hora time)
returns text
language sql
immutable
set search_path = public
as $$
  select to_char(timestamp '2000-01-01' + p_hora, 'FMHH12:MI') || case when p_hora >= time '12:00' then ' p. m.' else ' a. m.' end;
$$;

-- ──────────────────────────────────────────────────────────────────
-- 3. ¿Ya es la hora de este aviso? (lo llama n8n cada 15 minutos)
--    true UNA sola vez por hora configurada y por día. Tolerancia de 2 horas por si n8n estuvo apagado.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.toca_aviso(p_aviso text, p_ahora timestamptz default now())
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahora timestamp := p_ahora at time zone 'America/Bogota';
  v_hoy   date := (p_ahora at time zone 'America/Bogota')::date;
  n       integer;
begin
  if not exists (select 1 from public.avisos_programados a where a.aviso = p_aviso and a.activo) then
    return false;
  end if;
  if not exists (
    select 1 from public.horarios_avisos h
     where h.aviso = p_aviso and h.ultima_ejecucion is distinct from v_hoy
       and v_ahora >= v_hoy + h.hora and v_ahora < v_hoy + h.hora + interval '2 hours'
  ) then
    return false;
  end if;
  update public.horarios_avisos h set ultima_ejecucion = v_hoy
   where h.aviso = p_aviso and h.ultima_ejecucion is distinct from v_hoy
     and v_ahora >= v_hoy + h.hora and v_ahora < v_hoy + h.hora + interval '2 hours';
  get diagnostics n = row_count;
  return n > 0;
end;
$$;
revoke execute on function public.toca_aviso(text, timestamptz) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 4. Leer
-- ──────────────────────────────────────────────────────────────────
create or replace function public.consultar_horarios_avisos()
returns table (aviso text, nombre text, descripcion text, activo boolean, permite_varias boolean, orden integer, horas text[], horas_texto text)
language sql
stable
security definer
set search_path = public
as $$
  select a.aviso, a.nombre, a.descripcion, a.activo, a.permite_varias, a.orden,
         coalesce(array_agg(to_char(h.hora, 'HH24:MI') order by h.hora) filter (where h.id is not null), '{}'::text[]),
         coalesce(string_agg(public.hora_texto(h.hora), ', ' order by h.hora), 'sin hora')
    from public.avisos_programados a
    left join public.horarios_avisos h on h.aviso = a.aviso
   group by a.aviso, a.nombre, a.descripcion, a.activo, a.permite_varias, a.orden
   order by a.orden;
$$;
revoke execute on function public.consultar_horarios_avisos() from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 5. Guardar (panel y Telegram). p_horas = null no toca las horas; p_activo = null no toca el estado.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.guardar_horarios_aviso(p_aviso text, p_horas text[] default null, p_activo boolean default null)
returns table (ok boolean, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat    record;
  v_h      time[] := '{}';
  v_txt    text;
  v_t      time;
  v_rev    time;
  v_cie    time;
begin
  if auth.uid() is not null and not public.es_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select a.* into v_cat from public.avisos_programados a where a.aviso = p_aviso;
  if v_cat.aviso is null then
    return query select false, 'Ese aviso no existe.';
    return;
  end if;

  if p_horas is not null then
    foreach v_txt in array p_horas loop
      v_t := public.parse_hora_aviso(v_txt);
      if v_t is null then
        return query select false, 'La hora "' || coalesce(v_txt, '') || '" no es válida: usa horas en punto o con 15, 30 o 45 minutos (por ejemplo 7:00 am, 4:30 pm).';
        return;
      end if;
      if not (v_t = any (v_h)) then v_h := v_h || v_t; end if;
    end loop;
    if cardinality(v_h) = 0 then
      return query select false, 'Indica al menos una hora (o desactiva el aviso).';
      return;
    end if;
    if cardinality(v_h) > 1 and not v_cat.permite_varias then
      return query select false, 'El aviso "' || v_cat.nombre || '" solo tiene una hora al día.';
      return;
    end if;
    if cardinality(v_h) > 6 then
      return query select false, 'Máximo 6 horas por aviso.';
      return;
    end if;

    -- La revisión de citas tiene que ir antes del cierre del día.
    if p_aviso = 'revision' then
      v_rev := (select max(x) from unnest(v_h) x);
      v_cie := (select min(h.hora) from public.horarios_avisos h where h.aviso = 'cierre');
    elsif p_aviso = 'cierre' then
      v_rev := (select max(h.hora) from public.horarios_avisos h where h.aviso = 'revision');
      v_cie := (select min(x) from unnest(v_h) x);
    end if;
    if v_rev is not null and v_cie is not null and v_rev >= v_cie then
      return query select false, 'La revisión de citas tiene que ser antes del cierre del día (revisión ' || public.hora_texto(v_rev) || ', cierre ' || public.hora_texto(v_cie) || ').';
      return;
    end if;

    delete from public.horarios_avisos h where h.aviso = p_aviso and not (h.hora = any (v_h));
    insert into public.horarios_avisos (aviso, hora)
    select p_aviso, x from unnest(v_h) as x
    on conflict (aviso, hora) do nothing;
  end if;

  if p_activo is not null then
    update public.avisos_programados a set activo = p_activo where a.aviso = p_aviso;
    if p_activo then
      -- Al volver a activarlo, las horas que ya pasaron hoy no se disparan de golpe: sale desde la próxima hora.
      update public.horarios_avisos h set ultima_ejecucion = (now() at time zone 'America/Bogota')::date
       where h.aviso = p_aviso and h.hora <= (now() at time zone 'America/Bogota')::time;
    end if;
  end if;

  return query select true, null::text;
end;
$$;
revoke execute on function public.guardar_horarios_aviso(text, text[], boolean) from public, anon;
grant execute on function public.guardar_horarios_aviso(text, text[], boolean) to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 6. Telegram: consultar o cambiar. Devuelve siempre la lista completa de avisos con su estado actual.
--    acción: consultar | cambiar_horas | activar | desactivar
-- ──────────────────────────────────────────────────────────────────
create or replace function public.admin_horarios_avisos(p_accion text default 'consultar', p_aviso text default '', p_horas text default '')
returns table (aplicado boolean, error text, aviso text, nombre text, activo boolean, horas text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion text := lower(btrim(coalesce(p_accion, 'consultar')));
  v_aviso  text := lower(btrim(coalesce(p_aviso, '')));
  v_ok     boolean := true;
  v_err    text;
  v_arr    text[];
  v_lista  text;
begin
  select string_agg(a.aviso, ', ' order by a.orden) into v_lista from public.avisos_programados a;

  if v_accion not in ('consultar', 'cambiar_horas', 'activar', 'desactivar') then
    v_ok := false;
    v_err := 'La acción debe ser consultar, cambiar_horas, activar o desactivar.';
  elsif v_accion <> 'consultar' then
    if not exists (select 1 from public.avisos_programados a where a.aviso = v_aviso) then
      v_ok := false;
      v_err := 'Ese aviso no existe. Los avisos son: ' || v_lista || '.';
    elsif v_accion = 'cambiar_horas' then
      v_arr := regexp_split_to_array(btrim(coalesce(p_horas, '')), '\s*(,|;|\sy\s)\s*');
      select g.ok, g.error into v_ok, v_err from public.guardar_horarios_aviso(v_aviso, v_arr, null) g;
    else
      select g.ok, g.error into v_ok, v_err from public.guardar_horarios_aviso(v_aviso, null, v_accion = 'activar') g;
    end if;
  end if;

  return query
  select v_ok, v_err, c.aviso, c.nombre, c.activo, c.horas_texto
    from public.consultar_horarios_avisos() c
   order by c.orden;
end;
$$;
revoke execute on function public.admin_horarios_avisos(text, text, text) from public, anon, authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- REVERSA: volver los disparadores de n8n a su hora fija (AC-Admin-Avisos anterior) y después
--   drop function if exists public.admin_horarios_avisos(text, text, text);
--   drop function if exists public.guardar_horarios_aviso(text, text[], boolean);
--   drop function if exists public.consultar_horarios_avisos();
--   drop function if exists public.toca_aviso(text, timestamptz);
--   drop function if exists public.hora_texto(time);
--   drop function if exists public.parse_hora_aviso(text);
--   drop table if exists public.horarios_avisos; drop table if exists public.avisos_programados;
--   drop function if exists public.trg_horarios_avisos_hoy();
-- ══════════════════════════════════════════════════════════════════
