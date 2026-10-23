-- Saldo a favor de la clienta (22 oct 2026). Idempotente.
-- Política de Adriana: el anticipo pagado NO se devuelve en dinero. Si la clienta cancela con al menos
-- 24 horas de anticipación, el valor del anticipo queda como saldo a favor para llevarse en productos
-- (sin plazo para canjearlo). Si avisa con menos de 24 horas, el anticipo se pierde. Si mueve la cita con
-- al menos 24 horas de anticipación, el anticipo pasa a la nueva fecha (queda en la misma cita).
--
-- Cómo funciona en la base:
--   · movimientos_saldo: libro de movimientos por clienta. Suma = saldo a favor.
--       anticipo_cancelacion (+): se crea solo cuando se cancela una cita con anticipo y faltan ≥ 24 h.
--       canje_productos      (−): Adriana registra lo que la clienta se llevó en productos.
--       ajuste           (+ o −): excepciones (p. ej. el salón cancela con menos de 24 h).
--   · acreditar_anticipo_cita(cita, forzar): pasa el anticipo de una cita cancelada a saldo (una sola vez).
--   · Trigger sobre citas: al pasar a 'cancelada' con anticipo, llama a la función anterior.
--   · saldo_clienta(cliente): saldo actual.
begin;

create table if not exists public.movimientos_saldo (
  id          bigint generated always as identity primary key,
  cliente_id  uuid not null references public.clientes(id) on delete cascade,
  tipo        text not null check (tipo in ('anticipo_cancelacion', 'canje_productos', 'ajuste')),
  monto       numeric(12,0) not null check (monto <> 0),
  cita_id     uuid references public.citas(id) on delete set null,
  nota        text,
  creado_por  uuid default auth.uid(),
  creado_en   timestamptz not null default now(),
  constraint movimientos_saldo_signo check (
    (tipo = 'anticipo_cancelacion' and monto > 0)
    or (tipo = 'canje_productos' and monto < 0)
    or tipo = 'ajuste'
  )
);
create index if not exists idx_movimientos_saldo_cliente on public.movimientos_saldo (cliente_id, creado_en desc);
-- Un anticipo solo puede pasar a saldo una vez por cita.
create unique index if not exists uq_movimiento_anticipo_cita
  on public.movimientos_saldo (cita_id) where tipo = 'anticipo_cancelacion';
comment on table public.movimientos_saldo is 'Saldo a favor de la clienta para productos: + anticipos de citas canceladas con 24 h o más, − canjes en productos, ± ajustes.';

alter table public.movimientos_saldo enable row level security;
revoke all on public.movimientos_saldo from anon;
drop policy if exists "Staff lee saldos" on public.movimientos_saldo;
create policy "Staff lee saldos" on public.movimientos_saldo
  for select to authenticated using (public.es_staff());
drop policy if exists "Staff registra saldos" on public.movimientos_saldo;
create policy "Staff registra saldos" on public.movimientos_saldo
  for insert to authenticated with check (public.es_staff() and tipo in ('canje_productos', 'ajuste'));
drop policy if exists "Admin borra saldos" on public.movimientos_saldo;
create policy "Admin borra saldos" on public.movimientos_saldo
  for delete to authenticated using (public.es_admin());

-- ──────────────────────────────────────────────────────────────────
-- Saldo actual
-- ──────────────────────────────────────────────────────────────────
create or replace function public.saldo_clienta(p_cliente_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(m.monto), 0) from public.movimientos_saldo m where m.cliente_id = p_cliente_id;
$$;
revoke execute on function public.saldo_clienta(uuid) from public, anon;
grant  execute on function public.saldo_clienta(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────────
-- No dejar que un canje deje el saldo en negativo
-- ──────────────────────────────────────────────────────────────────
create or replace function public.trg_validar_movimiento_saldo()
returns trigger
language plpgsql
as $$
begin
  perform 1 from public.clientes c where c.id = new.cliente_id for update;
  if new.monto < 0 and public.saldo_clienta(new.cliente_id) + new.monto < 0 then
    raise exception 'El saldo a favor de la clienta no alcanza (saldo: %, movimiento: %)',
      public.saldo_clienta(new.cliente_id), new.monto;
  end if;
  return new;
end;
$$;
drop trigger if exists validar_movimiento_saldo on public.movimientos_saldo;
create trigger validar_movimiento_saldo
  before insert on public.movimientos_saldo
  for each row execute function public.trg_validar_movimiento_saldo();

-- ──────────────────────────────────────────────────────────────────
-- Pasar el anticipo de una cita cancelada a saldo a favor
--   p_forzar = false: solo si faltan 24 horas o más para la cita (regla normal).
--   p_forzar = true : sin importar el tiempo (Adriana decide, p. ej. cancela el salón).
-- Devuelve el monto acreditado (0 si no aplica o ya estaba acreditado).
-- ──────────────────────────────────────────────────────────────────
create or replace function public.acreditar_anticipo_cita(p_cita_id uuid, p_forzar boolean default false)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_id bigint;
begin
  if auth.uid() is not null and not public.es_staff() then
    raise exception 'No autorizado';
  end if;

  select ci.id, ci.cliente_id, ci.estado, ci.fecha_hora, ci.anticipo_monto, ci.anticipo_recibido_en
    into c from public.citas ci where ci.id = p_cita_id;
  if c.id is null or c.estado <> 'cancelada' or c.anticipo_recibido_en is null or coalesce(c.anticipo_monto, 0) <= 0 then
    return 0;
  end if;
  if not p_forzar and c.fecha_hora < now() + interval '24 hours' then
    return 0;
  end if;

  insert into public.movimientos_saldo (cliente_id, tipo, monto, cita_id, nota)
  values (c.cliente_id, 'anticipo_cancelacion', c.anticipo_monto, c.id,
          case when p_forzar then 'Anticipo de cita cancelada (acreditado por el salón)' else 'Anticipo de cita cancelada con 24 horas o más' end)
  on conflict do nothing
  returning id into v_id;

  return case when v_id is null then 0 else c.anticipo_monto end;
end;
$$;
revoke execute on function public.acreditar_anticipo_cita(uuid, boolean) from public, anon;
grant  execute on function public.acreditar_anticipo_cita(uuid, boolean) to authenticated;

create or replace function public.trg_acreditar_anticipo_cancelacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'cancelada' and old.estado is distinct from 'cancelada' and new.anticipo_recibido_en is not null then
    perform public.acreditar_anticipo_cita(new.id, false);
  end if;
  return new;
end;
$$;
drop trigger if exists acreditar_anticipo_cancelacion on public.citas;
create trigger acreditar_anticipo_cancelacion
  after update of estado on public.citas
  for each row execute function public.trg_acreditar_anticipo_cancelacion();

commit;

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK:
--   drop trigger if exists acreditar_anticipo_cancelacion on public.citas;
--   drop function if exists public.trg_acreditar_anticipo_cancelacion();
--   drop function if exists public.acreditar_anticipo_cita(uuid, boolean);
--   drop trigger if exists validar_movimiento_saldo on public.movimientos_saldo;
--   drop function if exists public.trg_validar_movimiento_saldo();
--   drop function if exists public.saldo_clienta(uuid);
--   drop table if exists public.movimientos_saldo;
