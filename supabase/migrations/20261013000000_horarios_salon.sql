-- Horarios del salón (13 oct 2026). REVISAR ANTES DE EJECUTAR.
-- Reglas pedidas por Adriana:
--   · Salón abierto 8:00 am a 6:00 pm, todos los días (por ahora).
--   · Almuerzo 1:00 pm a 2:00 pm: ninguna cita puede cruzarlo (salvo servicios marcados "puede cruzar almuerzo", p. ej. Balayage).
--   · Algunos servicios solo pueden EMPEZAR en una ventana (Balayage: 8:00 a 8:30 am).
--   · Excepciones: una profesional marcada como exenta por N días queda libre de TODAS las reglas de horario
--     durante esos días completos (atiende fuera de horario, en el almuerzo, en días cerrados, sin ventana de inicio).
--     Aun exenta, NO puede cruzarse con otras citas ni con bloqueos (eso lo sigue validando el trigger de solapamiento).
-- Todo se evalúa en hora de Colombia (America/Bogota, sin horario de verano).
-- Las citas YA existentes no se tocan: el trigger solo valida al crear o al mover/cambiar una cita.

begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Configuración general del salón (una sola fila)
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.configuracion_horario (
  id               smallint primary key default 1 check (id = 1),
  hora_apertura    time not null default '08:00',
  hora_cierre      time not null default '18:00',
  almuerzo_inicio  time not null default '13:00',
  almuerzo_fin     time not null default '14:00',
  -- 1 = lunes … 7 = domingo (ISO)
  dias_atencion    smallint[] not null default '{1,2,3,4,5,6,7}',
  updated_at       timestamptz not null default now(),
  constraint chk_horario_orden check (hora_apertura < hora_cierre),
  constraint chk_almuerzo_orden check (almuerzo_inicio < almuerzo_fin),
  constraint chk_almuerzo_dentro check (almuerzo_inicio >= hora_apertura and almuerzo_fin <= hora_cierre),
  constraint chk_dias_validos check (dias_atencion <@ array[1,2,3,4,5,6,7]::smallint[])
);
insert into public.configuracion_horario (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_configuracion_horario_updated on public.configuracion_horario;
create trigger trg_configuracion_horario_updated
before update on public.configuracion_horario
for each row execute function public.set_updated_at();

comment on table public.configuracion_horario is 'Horario general del salón (fila única). Lo editan el panel y el agente de Telegram.';

alter table public.configuracion_horario enable row level security;
revoke all on public.configuracion_horario from anon;
create policy "Staff lee horario" on public.configuracion_horario
  for select to authenticated using (public.es_staff());
create policy "Admin modifica horario" on public.configuracion_horario
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- ──────────────────────────────────────────────────────────────────
-- 2. Reglas por servicio
-- ──────────────────────────────────────────────────────────────────
alter table public.servicios
  add column if not exists inicio_desde time,
  add column if not exists inicio_hasta time,
  add column if not exists puede_cruzar_almuerzo boolean not null default false;

alter table public.servicios drop constraint if exists chk_servicio_ventana_inicio;
alter table public.servicios add constraint chk_servicio_ventana_inicio
  check (
    (inicio_desde is null and inicio_hasta is null)
    or (inicio_desde is not null and inicio_hasta is not null and inicio_desde <= inicio_hasta)
  );

comment on column public.servicios.inicio_desde is 'Si no es nulo, el servicio solo puede EMPEZAR entre inicio_desde e inicio_hasta (inclusive).';
comment on column public.servicios.puede_cruzar_almuerzo is 'true = el servicio puede quedar a caballo de la hora de almuerzo.';

-- ──────────────────────────────────────────────────────────────────
-- 3. Excepciones: profesional exenta de las reglas de horario por días completos
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.excepciones_horario (
  id              uuid primary key default gen_random_uuid(),
  profesional_id  uuid not null references public.profesionales(id) on delete cascade,
  fecha_desde     date not null,
  fecha_hasta     date not null,
  motivo          text,
  created_by      uuid references public.perfiles(id),
  created_at      timestamptz not null default now(),
  constraint chk_excepcion_fechas check (fecha_hasta >= fecha_desde)
);
create index if not exists idx_excepciones_horario_prof_fechas
  on public.excepciones_horario (profesional_id, fecha_desde, fecha_hasta);

comment on table public.excepciones_horario is 'Días completos en que una profesional queda exenta de las reglas de horario del salón.';

alter table public.excepciones_horario enable row level security;
revoke all on public.excepciones_horario from anon;
create policy "Staff lee excepciones" on public.excepciones_horario
  for select to authenticated using (public.es_staff());
create policy "Admin gestiona excepciones" on public.excepciones_horario
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ──────────────────────────────────────────────────────────────────
-- 4. Función central: devuelve NULL si la cita cumple las reglas, o el motivo en español
--    La usan el trigger de citas, el panel (rpc) y las herramientas de n8n.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.horario_violado(
  p_profesional uuid,
  p_servicio    uuid,
  p_inicio      timestamptz,
  p_fin         timestamptz
) returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cfg        public.configuracion_horario%rowtype;
  v_ini      timestamp := p_inicio at time zone 'America/Bogota';
  v_fin      timestamp := p_fin    at time zone 'America/Bogota';
  v_t_ini    time := (p_inicio at time zone 'America/Bogota')::time;
  v_t_fin    time := (p_fin    at time zone 'America/Bogota')::time;
  v_cruza    boolean := false;
  v_desde    time;
  v_hasta    time;
  v_dia      smallint := extract(isodow from (p_inicio at time zone 'America/Bogota'))::smallint;
begin
  select * into cfg from public.configuracion_horario where id = 1;
  if not found then
    return null; -- sin configuración no se restringe nada
  end if;

  -- Exenta ese día completo (se mira el día en que EMPIEZA la cita)
  if p_profesional is not null and exists (
    select 1 from public.excepciones_horario e
    where e.profesional_id = p_profesional
      and v_ini::date between e.fecha_desde and e.fecha_hasta
  ) then
    return null;
  end if;

  select s.puede_cruzar_almuerzo, s.inicio_desde, s.inicio_hasta
    into v_cruza, v_desde, v_hasta
  from public.servicios s where s.id = p_servicio;
  v_cruza := coalesce(v_cruza, false);

  -- Día de atención
  if not (v_dia = any (cfg.dias_atencion)) then
    return 'El salón no atiende ese día';
  end if;

  -- Horario de apertura y cierre (y que no termine otro día)
  if v_t_ini < cfg.hora_apertura or v_fin::date <> v_ini::date or v_t_fin > cfg.hora_cierre then
    return 'Fuera del horario del salón ('
      || to_char(timestamp '2000-01-01' + cfg.hora_apertura, 'FMHH12:MI am') || ' a '
      || to_char(timestamp '2000-01-01' + cfg.hora_cierre,   'FMHH12:MI am') || ')';
  end if;

  -- Ventana de inicio del servicio (p. ej. Balayage)
  if v_desde is not null and (v_t_ini < v_desde or v_t_ini > v_hasta) then
    return 'Este servicio solo puede empezar entre '
      || to_char(timestamp '2000-01-01' + v_desde, 'FMHH12:MI am') || ' y '
      || to_char(timestamp '2000-01-01' + v_hasta, 'FMHH12:MI am');
  end if;

  -- Almuerzo
  if not v_cruza and v_t_ini < cfg.almuerzo_fin and v_t_fin > cfg.almuerzo_inicio then
    return 'Cruza la hora de almuerzo ('
      || to_char(timestamp '2000-01-01' + cfg.almuerzo_inicio, 'FMHH12:MI am') || ' a '
      || to_char(timestamp '2000-01-01' + cfg.almuerzo_fin,    'FMHH12:MI am') || ')';
  end if;

  return null;
end;
$$;
revoke execute on function public.horario_violado(uuid, uuid, timestamptz, timestamptz) from public, anon;
grant  execute on function public.horario_violado(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 5. Trigger de citas: mismo de antes + regla de horario (después de citas y bloqueos)
-- ──────────────────────────────────────────────────────────────────
create or replace function public.validar_solapamiento_citas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duracion_min integer;
  v_fin_new timestamptz;
  v_motivo text;
begin
  if new.estado in ('cancelada', 'no_asistio') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not (
         new.fecha_hora IS DISTINCT FROM old.fecha_hora or
         new.duracion_min IS DISTINCT FROM old.duracion_min or
         new.profesional_id IS DISTINCT FROM old.profesional_id or
         new.servicio_id IS DISTINCT FROM old.servicio_id or
         (old.estado in ('cancelada', 'no_asistio') and new.estado not in ('cancelada', 'no_asistio'))
       ) then
      return new;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.profesional_id::text));

  v_duracion_min := coalesce(
    new.duracion_min,
    (select s.duracion_min from public.servicios s where s.id = new.servicio_id),
    60
  );
  v_fin_new := new.fecha_hora + make_interval(mins => v_duracion_min);

  -- 1. Contra otras citas activas de la misma profesional
  if exists (
    select 1 from public.citas c
    where c.profesional_id = new.profesional_id
      and c.id is distinct from new.id
      and c.estado not in ('cancelada', 'no_asistio')
      and new.fecha_hora < c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60))
      and v_fin_new > c.fecha_hora
  ) then
    raise exception 'La profesional ya tiene una cita en ese horario' using errcode = '23P01';
  end if;

  -- 2. Contra bloqueos de horario
  if exists (
    select 1 from public.bloqueos_horario b
    where b.profesional_id = new.profesional_id
      and new.fecha_hora < b.fecha_fin
      and v_fin_new > b.fecha_inicio
  ) then
    raise exception 'La profesional tiene un bloqueo en ese horario' using errcode = '23P01';
  end if;

  -- 3. Reglas de horario del salón (la exención por días la resuelve horario_violado)
  v_motivo := public.horario_violado(new.profesional_id, new.servicio_id, new.fecha_hora, v_fin_new);
  if v_motivo is not null then
    raise exception 'Horario no permitido: %', v_motivo using errcode = '23P01';
  end if;

  return new;
end;
$$;
revoke execute on function public.validar_solapamiento_citas() from public, anon, authenticated;

-- El trigger ya existe y apunta a la función por nombre; se recrea por si acaso.
drop trigger if exists trigger_validar_solapamiento_citas on public.citas;
create trigger trigger_validar_solapamiento_citas
before insert or update on public.citas
for each row execute function public.validar_solapamiento_citas();

commit;

-- ══════════════════════════════════════════════════════════════════
-- DESPUÉS de ejecutar (aparte, una por una):
--
-- A) Ver cómo se llama exactamente Balayage antes de marcarlo:
--    select id, nombre, duracion_min from public.servicios where nombre ilike '%balayage%';
--
-- B) Marcarlo (ajustar el WHERE al resultado de A):
--    update public.servicios
--       set inicio_desde = '08:00', inicio_hasta = '08:30', puede_cruzar_almuerzo = true
--     where nombre ilike '%balayage%';
--
-- C) Citas futuras ya agendadas que NO cumplirían las reglas (solo informativo, no se modifican):
--    select c.id, c.fecha_hora at time zone 'America/Bogota' as hora_local, c.profesional_id,
--           public.horario_violado(c.profesional_id, c.servicio_id, c.fecha_hora,
--                                  c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60))) as motivo
--      from public.citas c
--     where c.estado not in ('cancelada','no_asistio') and c.fecha_hora >= now()
--       and public.horario_violado(c.profesional_id, c.servicio_id, c.fecha_hora,
--                                  c.fecha_hora + make_interval(mins => coalesce(c.duracion_min, 60))) is not null;
--
-- Rollback (solo si algo falla; ejecutar aparte):
--    -- volver a la versión anterior de validar_solapamiento_citas (migración 20261007000000), luego:
--    drop function if exists public.horario_violado(uuid, uuid, timestamptz, timestamptz);
--    drop table if exists public.excepciones_horario;
--    drop table if exists public.configuracion_horario;
--    alter table public.servicios drop column if exists inicio_desde, drop column if exists inicio_hasta,
--                                 drop column if exists puede_cruzar_almuerzo;
