-- Adicionales de servicios (17 oct 2026). REVISAR ANTES DE EJECUTAR.
-- Pedido de Adriana: dentro de cada servicio se pueden crear "adicionales" (por ejemplo diseño de uñas,
-- retiro de esmalte). Un adicional puede aplicarse a VARIOS servicios, suma duración y precio a la cita,
-- se muestra en la web y lo ofrece el agente de WhatsApp al agendar. Se gestionan desde la página de cada
-- servicio del panel y por Telegram.
--
-- Modelo:
--   adicionales            catálogo (una sola ficha por adicional: mismo precio y duración en todos los servicios)
--   servicio_adicionales   a qué servicios se puede agregar cada adicional
--   cita_adicionales       los adicionales que eligió una cita (copia del nombre, precio y duración al momento de agendar)
--   citas.duracion_min     pasa a ser la duración TOTAL (servicio + adicionales); por eso el calendario, el agente
--                          y el trigger de solapamiento no cambian.
-- Idempotente: se puede ejecutar de nuevo sin romper nada.

begin;

-- ──────────────────────────────────────────────────────────────────
-- 1. Tablas
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.adicionales (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  duracion_min  integer not null default 0,
  precio        numeric(12, 0) not null,
  precio_hasta  numeric(12, 0),
  precio_desde  boolean not null default false,
  activo        boolean not null default true,
  orden         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint adicionales_nombre_no_vacio check (btrim(nombre) <> ''),
  constraint adicionales_duracion_valida check (duracion_min >= 0 and duracion_min <= 600),
  constraint adicionales_precio_valido check (precio >= 0),
  constraint adicionales_precio_hasta_valido check (precio_hasta is null or precio_hasta >= precio)
);
create unique index if not exists adicionales_nombre_unico
  on public.adicionales (lower(btrim(nombre)));

drop trigger if exists trg_adicionales_updated on public.adicionales;
create trigger trg_adicionales_updated
before update on public.adicionales
for each row execute function public.set_updated_at();

create table if not exists public.servicio_adicionales (
  servicio_id  uuid not null references public.servicios(id) on delete cascade,
  adicional_id uuid not null references public.adicionales(id) on delete cascade,
  orden        integer not null default 0,
  created_at   timestamptz not null default now(),
  primary key (servicio_id, adicional_id)
);
create index if not exists idx_servicio_adicionales_adicional
  on public.servicio_adicionales (adicional_id);

create table if not exists public.cita_adicionales (
  id            uuid primary key default gen_random_uuid(),
  cita_id       uuid not null references public.citas(id) on delete cascade,
  adicional_id  uuid references public.adicionales(id) on delete set null,
  nombre        text not null,
  precio        numeric(12, 0) not null,
  precio_hasta  numeric(12, 0),
  duracion_min  integer not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_cita_adicionales_cita on public.cita_adicionales (cita_id);
create index if not exists idx_cita_adicionales_adicional on public.cita_adicionales (adicional_id);
create unique index if not exists cita_adicionales_unico
  on public.cita_adicionales (cita_id, adicional_id) where adicional_id is not null;

comment on table public.adicionales is 'Adicionales de servicios (diseño, retiro, etc.). Suman duración y precio a la cita.';
comment on column public.adicionales.precio is 'Precio (o precio "desde" si hay precio_hasta o precio_desde).';
comment on table public.servicio_adicionales is 'Servicios a los que se puede agregar cada adicional.';
comment on table public.cita_adicionales is 'Adicionales elegidos en una cita, con nombre, precio y duración copiados al agendar.';
comment on column public.citas.duracion_min is 'Duración total de la cita: servicio más adicionales.';

-- ──────────────────────────────────────────────────────────────────
-- 2. Permisos (RLS)
-- ──────────────────────────────────────────────────────────────────
alter table public.adicionales enable row level security;
alter table public.servicio_adicionales enable row level security;
alter table public.cita_adicionales enable row level security;

drop policy if exists "Adicionales activos son públicos" on public.adicionales;
create policy "Adicionales activos son públicos" on public.adicionales
  for select using (activo = true);
drop policy if exists "Staff gestiona adicionales" on public.adicionales;
create policy "Staff gestiona adicionales" on public.adicionales
  for all to authenticated using (public.es_staff()) with check (public.es_staff());

drop policy if exists "Vínculos de adicionales son públicos" on public.servicio_adicionales;
create policy "Vínculos de adicionales son públicos" on public.servicio_adicionales
  for select using (true);
drop policy if exists "Staff gestiona vínculos de adicionales" on public.servicio_adicionales;
create policy "Staff gestiona vínculos de adicionales" on public.servicio_adicionales
  for all to authenticated using (public.es_staff()) with check (public.es_staff());

drop policy if exists "Staff gestiona adicionales de citas" on public.cita_adicionales;
create policy "Staff gestiona adicionales de citas" on public.cita_adicionales
  for all to authenticated using (public.es_staff()) with check (public.es_staff());
revoke all on public.cita_adicionales from anon;

-- ──────────────────────────────────────────────────────────────────
-- 3. Adicionales válidos de un servicio (activos y vinculados) entre los ids pedidos
--    Solo la usan funciones de esta migración y n8n (que se conecta como postgres).
-- ──────────────────────────────────────────────────────────────────
create or replace function public.adicionales_validos(p_servicio uuid, p_ids uuid[])
returns table (id uuid, nombre text, precio numeric, precio_hasta numeric, duracion_min integer)
language sql
stable
set search_path = ''
as $$
  select a.id, a.nombre, a.precio, a.precio_hasta, a.duracion_min
  from public.adicionales a
  join public.servicio_adicionales sa on sa.adicional_id = a.id and sa.servicio_id = p_servicio
  where a.activo = true
    and a.id = any (coalesce(p_ids, '{}'::uuid[]))
  order by sa.orden, a.nombre;
$$;
revoke execute on function public.adicionales_validos(uuid, uuid[]) from public, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 4. horarios_libres: ahora cuenta los minutos de los adicionales (sexto parámetro, por defecto 0).
--    Si se manda p_excluir_cita (mover una cita), se usa la duración propia de esa cita, que ya es la total.
--    El agente de n8n y el panel que no mandan el parámetro nuevo reciben lo mismo que antes.
-- ──────────────────────────────────────────────────────────────────
drop function if exists public.horarios_libres(uuid, date, uuid, boolean, uuid);

create or replace function public.horarios_libres(
  p_servicio        uuid,
  p_fecha           date,
  p_profesional     uuid    default null,
  p_incluir_pasadas boolean default false,
  p_excluir_cita    uuid    default null,
  p_duracion_extra  integer default 0
) returns table (
  profesional_id uuid,
  profesional    text,
  inicio_local   text,
  fin_local      text
)
language sql
stable
security definer
set search_path = ''
as $$
  with srv as (
    select coalesce(
             (select ci.duracion_min from public.citas ci where ci.id = p_excluir_cita),
             coalesce((select s.duracion_min from public.servicios s where s.id = p_servicio), 60)
               + greatest(coalesce(p_duracion_extra, 0), 0)
           ) as dur
  ),
  cand as (
    select p.id as pid, p.nombre, p.orden,
           (p_fecha::timestamp + n * interval '15 minutes') as ini_local
    from public.profesionales p
    cross join generate_series(24, 87) as n
    where p.activo = true
      and (p_profesional is null or p.id = p_profesional)
  ),
  rango as (
    select c.pid, c.nombre, c.orden, c.ini_local,
           (c.ini_local at time zone 'America/Bogota') as ini,
           ((c.ini_local + make_interval(mins => srv.dur)) at time zone 'America/Bogota') as fin,
           srv.dur
    from cand c cross join srv
  )
  select r.pid,
         r.nombre,
         to_char(r.ini_local, 'HH24:MI'),
         to_char(r.ini_local + make_interval(mins => r.dur), 'HH24:MI')
  from rango r
  where (p_incluir_pasadas or r.ini > now())
    and public.horario_violado(r.pid, p_servicio, r.ini, r.fin) is null
    and not exists (
      select 1 from public.citas ci
      where ci.profesional_id = r.pid
        and ci.id is distinct from p_excluir_cita
        and ci.estado not in ('cancelada', 'no_asistio')
        and ci.fecha_hora < r.fin
        and ci.fecha_hora + make_interval(mins => coalesce(ci.duracion_min, 60)) > r.ini
    )
    and not exists (
      select 1 from public.bloqueos_horario b
      where b.profesional_id = r.pid
        and b.fecha_inicio < r.fin
        and b.fecha_fin > r.ini
    )
  order by r.ini_local, r.orden
  limit 600;
$$;

revoke execute on function public.horarios_libres(uuid, date, uuid, boolean, uuid, integer) from public, anon;
grant  execute on function public.horarios_libres(uuid, date, uuid, boolean, uuid, integer) to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 5. Crear una cita con adicionales en una sola operación (la usan el panel y el agente de WhatsApp)
--    · La duración total y los precios salen de la base, no de lo que mande quien llama.
--    · Los adicionales deben estar activos y vinculados al servicio; si alguno no lo está, no se crea nada.
--    · El trigger de solapamiento y de horario valida la duración TOTAL (si choca, falla todo).
--    · Desde WhatsApp también deja el aviso a Adriana (cola de Telegram), con los adicionales.
-- ──────────────────────────────────────────────────────────────────
create or replace function public.crear_cita_con_adicionales(
  p_cliente        uuid,
  p_profesional    uuid,
  p_servicio       uuid,
  p_inicio         timestamptz,
  p_duracion_base  integer default null,
  p_adicionales    uuid[]  default '{}',
  p_canal          text    default 'presencial',
  p_estado         text    default 'pendiente',
  p_notas_cliente  text    default null
) returns table (
  cita_id             uuid,
  inicio_local        text,
  fin_local           text,
  estado              text,
  duracion_total_min  integer,
  adicionales         text,
  precio_desde_total  numeric,
  precio_hasta_total  numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids       uuid[];
  v_validos   integer;
  v_base      integer;
  v_extra     integer;
  v_total     integer;
  v_cita      uuid;
  v_inicio    timestamptz;
  v_srv       numeric;
  v_srv_hasta numeric;
  v_nombres   text;
begin
  -- Un usuario autenticado del panel debe ser staff; n8n se conecta como postgres (sin auth.uid()).
  if auth.uid() is not null and not public.es_staff() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_estado not in ('pendiente', 'confirmada') then
    raise exception 'Estado de cita no permitido' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct x), '{}'::uuid[]) into v_ids
  from unnest(coalesce(p_adicionales, '{}'::uuid[])) as x;

  select count(*), coalesce(sum(v.duracion_min), 0), string_agg(v.nombre, ', ' order by v.nombre)
    into v_validos, v_extra, v_nombres
  from public.adicionales_validos(p_servicio, v_ids) v;

  if v_validos <> cardinality(v_ids) then
    raise exception 'Adicional no válido para este servicio' using errcode = '22023';
  end if;

  select s.duracion_min, s.precio, s.precio_hasta
    into v_base, v_srv, v_srv_hasta
  from public.servicios s where s.id = p_servicio;
  v_base  := coalesce(v_base, p_duracion_base, 60);
  v_total := v_base + v_extra;

  insert into public.citas (
    cliente_id, profesional_id, servicio_id, fecha_hora, duracion_min,
    estado, canal_origen, notas_cliente,
    recordatorio_24h_enviado, recordatorio_2h_enviado, seguimiento_enviado
  ) values (
    p_cliente, p_profesional, p_servicio, p_inicio, v_total,
    p_estado, p_canal, nullif(btrim(coalesce(p_notas_cliente, '')), ''),
    false, false, false
  ) returning id, fecha_hora into v_cita, v_inicio;

  insert into public.cita_adicionales (cita_id, adicional_id, nombre, precio, precio_hasta, duracion_min)
  select v_cita, v.id, v.nombre, v.precio, v.precio_hasta, v.duracion_min
  from public.adicionales_validos(p_servicio, v_ids) v;

  if p_canal = 'whatsapp' then
    insert into public.avisos_admin (tipo, cita_id, mensaje)
    select 'cita_nueva', v_cita,
           'Cita nueva por WhatsApp: ' || coalesce(cl.nombre, 'sin nombre registrado')
             || ' (' || coalesce(cl.telefono, 'sin teléfono') || '). '
             || coalesce(s.nombre, 'Servicio sin nombre')
             || coalesce(' (adicionales: ' || v_nombres || ')', '')
             || ' con ' || coalesce(p.nombre, 'profesional sin nombre')
             || ', ' || public.formato_cita_aviso(v_inicio, v_total) || '.'
    from public.clientes cl
    left join public.servicios s on s.id = p_servicio
    left join public.profesionales p on p.id = p_profesional
    where cl.id = p_cliente;
  end if;

  return query
  select v_cita,
         to_char(v_inicio at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'),
         to_char((v_inicio + make_interval(mins => v_total)) at time zone 'America/Bogota', 'HH24:MI'),
         p_estado,
         v_total,
         v_nombres,
         coalesce(v_srv, 0) + coalesce((select sum(precio) from public.cita_adicionales where cita_adicionales.cita_id = v_cita), 0),
         coalesce(v_srv_hasta, v_srv, 0)
           + coalesce((select sum(coalesce(precio_hasta, precio)) from public.cita_adicionales where cita_adicionales.cita_id = v_cita), 0);
end;
$$;

revoke execute on function public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text) from public, anon;
grant  execute on function public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text) to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 6. Al completar una cita sin precio cobrado, se copia el precio del servicio MÁS el de sus adicionales
--    (sigue siendo el precio "desde"; Adriana puede ajustarlo en el panel).
-- ──────────────────────────────────────────────────────────────────
create or replace function public.asignar_precio_cobrado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado in ('cancelada', 'no_asistio') then
    new.precio_cobrado := null;
  elsif new.estado = 'completada'
     and new.precio_cobrado is null
     and new.servicio_id is not null then
    new.precio_cobrado :=
      (select s.precio from public.servicios s where s.id = new.servicio_id)
      + coalesce((select sum(ca.precio) from public.cita_adicionales ca where ca.cita_id = new.id), 0);
  end if;
  return new;
end;
$$;
revoke execute on function public.asignar_precio_cobrado() from public, anon, authenticated;

commit;

-- Rollback (solo si algo falla; ejecutar aparte):
--   drop function if exists public.crear_cita_con_adicionales(uuid, uuid, uuid, timestamptz, integer, uuid[], text, text, text);
--   drop function if exists public.adicionales_validos(uuid, uuid[]);
--   drop table if exists public.cita_adicionales, public.servicio_adicionales, public.adicionales;
--   y ejecutar de nuevo 20261014000000_horarios_libres_excluir_cita.sql y 20261008000002_limpiar_precio_inasistencias.sql
