-- Anticipos (21 oct 2026), etapa 1. Idempotente.
-- Reglas de Brandon: pago por transferencia o efectivo; anticipo del 50 % para agendar; aplica a clientas
-- nuevas y a las que Adriana seleccione (desde el panel o por Telegram).
--   · clientes.anticipo_modo: vacío = automático (se pide si la clienta es nueva, o sea, si nunca ha
--     tenido una cita completada); 'si' = siempre se pide; 'no' = nunca se pide.
--   · configuracion_anticipos: fila única con el porcentaje (50) y las horas que se aparta el horario
--     mientras la clienta paga (3). Las usará la etapa 2 (solicitud de anticipo con bloqueo temporal).
--   · citas.anticipo_monto y citas.anticipo_recibido_en: anticipo que Adriana confirmó para esa cita.
--   · requiere_anticipo(cliente): aplica la regla anterior (la usan los agentes de n8n).
begin;

alter table public.clientes
  add column if not exists anticipo_modo text;
alter table public.clientes
  drop constraint if exists clientes_anticipo_modo_valido;
alter table public.clientes
  add constraint clientes_anticipo_modo_valido check (anticipo_modo is null or anticipo_modo in ('si', 'no'));
comment on column public.clientes.anticipo_modo is 'Anticipo: vacío = automático (se pide a clientas nuevas), si = siempre, no = nunca.';

create table if not exists public.configuracion_anticipos (
  id          smallint primary key default 1 check (id = 1),
  porcentaje  smallint not null default 50 check (porcentaje between 1 and 100),
  horas_pago  smallint not null default 3  check (horas_pago between 1 and 72),
  updated_at  timestamptz not null default now()
);
insert into public.configuracion_anticipos (id) values (1) on conflict (id) do nothing;
comment on table public.configuracion_anticipos is 'Anticipo para agendar: porcentaje del valor y horas que se aparta el horario mientras la clienta paga (fila única).';

alter table public.configuracion_anticipos enable row level security;
revoke all on public.configuracion_anticipos from anon;
drop policy if exists "Staff lee anticipos" on public.configuracion_anticipos;
create policy "Staff lee anticipos" on public.configuracion_anticipos
  for select to authenticated using (public.es_staff());
drop policy if exists "Admin modifica anticipos" on public.configuracion_anticipos;
create policy "Admin modifica anticipos" on public.configuracion_anticipos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

alter table public.citas
  add column if not exists anticipo_monto numeric(12,0),
  add column if not exists anticipo_recibido_en timestamptz;
alter table public.citas
  drop constraint if exists citas_anticipo_monto_valido;
alter table public.citas
  add constraint citas_anticipo_monto_valido check (anticipo_monto is null or anticipo_monto > 0);
comment on column public.citas.anticipo_monto is 'Anticipo recibido para agendar esta cita (pesos). Vacío = sin anticipo.';
comment on column public.citas.anticipo_recibido_en is 'Cuándo confirmó Adriana que recibió el anticipo.';

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
           else not exists (
                  select 1 from public.citas x
                   where x.cliente_id = c.id and x.estado = 'completada')
         end
    from public.clientes c
   where c.id = p_cliente_id;
$$;
revoke execute on function public.requiere_anticipo(uuid) from public, anon;
grant  execute on function public.requiere_anticipo(uuid) to authenticated;

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (solo si hay que deshacer):
--   drop function if exists public.requiere_anticipo(uuid);
--   alter table public.citas drop column if exists anticipo_monto, drop column if exists anticipo_recibido_en;
--   drop table if exists public.configuracion_anticipos;
--   alter table public.clientes drop column if exists anticipo_modo;
