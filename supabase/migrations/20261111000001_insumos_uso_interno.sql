-- Insumos de uso interno (11 nov 2026)
-- Pedido de Adriana: llevar el inventario de lo que se gasta en el salón (tintes, colorantes, oxidantes…)
-- sin que salga en la tienda ni en los avisos de inventario de Telegram.
-- Diseño: se reutilizan productos/inventario/movimientos_inventario con una marca `uso_interno`.
--  1. productos.uso_interno (por defecto false: nada cambia para lo que ya existe).
--  2. La tienda pública solo ve productos activos que NO son de uso interno (política de productos y de stock).
--  3. inventario_completo (que leen el panel de inventario y los avisos de Telegram) deja de incluir insumos;
--     la vista nueva insumos_completo es la de los insumos. Así los avisos no cambian ni hay que tocar n8n.
--  4. Origen de movimiento nuevo: consumo_interno.
--  5. crear_orden_tienda rechaza insumos aunque alguien los pidiera por la API.
--  6. Dos funciones para el agente de Telegram (solo administradoras): buscar_inventario_admin y mover_inventario_admin.
-- Idempotente. Revertir: al final.
begin;

-- 1. Marca ----------------------------------------------------------------------------------------------
alter table public.productos add column if not exists uso_interno boolean not null default false;
comment on column public.productos.uso_interno is 'true = insumo del salón (tintes, colorantes…): no se vende, no sale en la tienda ni en los avisos de inventario.';

-- 2. Tienda pública ---------------------------------------------------------------------------------------
drop policy if exists "Productos activos son públicos" on public.productos;
create policy "Productos activos son públicos"
  on public.productos for select
  using (activo = true and uso_interno = false);

drop policy if exists "Stock visible al publico" on public.inventario;
create policy "Stock visible al publico" on public.inventario
  for select to anon
  using (exists (select 1 from public.productos p
                 where p.id = inventario.producto_id and p.activo and not p.uso_interno));

-- 3. Vistas ---------------------------------------------------------------------------------------------
create or replace view public.inventario_completo as
select
  i.*,
  p.nombre as producto_nombre,
  p.marca as producto_marca,
  p.categoria_id,
  c.nombre as categoria_nombre,
  (i.stock_virtual + i.stock_fisico) as stock_total,
  case
    when (i.stock_virtual + i.stock_fisico) = 0 then 'agotado'
    when (i.stock_virtual + i.stock_fisico) <= i.umbral_alerta then 'critico'
    else 'disponible'
  end as estado_stock
from public.inventario i
join public.productos p on p.id = i.producto_id
join public.categorias_productos c on c.id = p.categoria_id
where not p.uso_interno;

create or replace view public.insumos_completo as
select
  i.*,
  p.nombre as producto_nombre,
  p.marca as producto_marca,
  p.categoria_id,
  c.nombre as categoria_nombre,
  (i.stock_virtual + i.stock_fisico) as stock_total,
  case
    when (i.stock_virtual + i.stock_fisico) = 0 then 'agotado'
    when (i.stock_virtual + i.stock_fisico) <= i.umbral_alerta then 'critico'
    else 'disponible'
  end as estado_stock
from public.inventario i
join public.productos p on p.id = i.producto_id
join public.categorias_productos c on c.id = p.categoria_id
where p.uso_interno;

alter view public.inventario_completo set (security_invoker = true);
alter view public.insumos_completo set (security_invoker = true);
revoke all on public.insumos_completo from anon;
revoke insert, update, delete, truncate, references, trigger on public.insumos_completo from authenticated;

-- 4. Origen "consumo_interno" ------------------------------------------------------------------------------
do $$
declare v_nombre text;
begin
  select conname into v_nombre
    from pg_constraint
   where conrelid = 'public.movimientos_inventario'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%origen%';
  if v_nombre is not null then
    execute format('alter table public.movimientos_inventario drop constraint %I', v_nombre);
  end if;
  alter table public.movimientos_inventario
    add constraint movimientos_inventario_origen_check
    check (origen in ('compra','venta_online','venta_fisica','devolucion','ajuste_manual','consumo_interno'));
end $$;

-- 5. Pedido de la tienda: sin insumos -----------------------------------------------------------------------
create or replace function public.crear_orden_tienda(
  p_nombre    text,
  p_telefono  text,
  p_direccion text,
  p_ciudad    text,
  p_notas     text,
  p_items     jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden    uuid;
  v_subtotal numeric := 0;
  r          record;
  v_prod     record;
  v_inv      record;
  v_antes    int;
  v_virtual  int;
  v_resto    int;
begin
  p_nombre    := btrim(coalesce(p_nombre, ''));
  p_telefono  := btrim(coalesce(p_telefono, ''));
  p_direccion := btrim(coalesce(p_direccion, ''));
  p_ciudad    := btrim(coalesce(p_ciudad, ''));
  p_notas     := nullif(btrim(coalesce(p_notas, '')), '');

  if p_nombre = ''    or length(p_nombre)    > 120 then raise exception 'El nombre es obligatorio.'; end if;
  if p_telefono = ''  or length(p_telefono)  > 30  then raise exception 'El teléfono es obligatorio.'; end if;
  if p_direccion = '' or length(p_direccion) > 250 then raise exception 'La dirección es obligatoria.'; end if;
  if p_ciudad = ''    or length(p_ciudad)    > 80  then raise exception 'La ciudad es obligatoria.'; end if;
  if p_notas is not null and length(p_notas) > 500 then raise exception 'Las notas son demasiado largas.'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'El carrito está vacío.';
  end if;

  insert into public.ordenes (estado, subtotal, costo_envio, total, nombre_envio, telefono_envio,
                              direccion_envio, ciudad_envio, notas_cliente)
  values ('pendiente', 0, 0, 0, p_nombre, p_telefono, p_direccion, p_ciudad, p_notas)
  returning id into v_orden;

  for r in
    select x.producto_id, sum(x.cantidad)::int as cantidad
      from jsonb_to_recordset(p_items) as x(producto_id uuid, cantidad int)
     group by x.producto_id
     order by x.producto_id
  loop
    if r.producto_id is null or r.cantidad is null or r.cantidad < 1 or r.cantidad > 50 then
      raise exception 'La cantidad de un producto no es válida.';
    end if;

    select id, nombre, precio into v_prod
      from public.productos where id = r.producto_id and activo and not uso_interno;
    if not found then
      raise exception 'Un producto del carrito ya no está disponible.';
    end if;
    if v_prod.precio is null or v_prod.precio <= 0 then
      raise exception 'El producto % aún no tiene precio y no se puede comprar.', v_prod.nombre;
    end if;

    insert into public.items_orden (orden_id, producto_id, nombre, precio, cantidad, subtotal)
    values (v_orden, v_prod.id, v_prod.nombre, v_prod.precio, r.cantidad, v_prod.precio * r.cantidad);
    v_subtotal := v_subtotal + v_prod.precio * r.cantidad;

    select stock_virtual, stock_fisico into v_inv
      from public.inventario where producto_id = r.producto_id for update;
    if found then
      v_antes := v_inv.stock_virtual + v_inv.stock_fisico;
      if v_antes < r.cantidad then
        raise exception 'No hay suficiente stock de %.', v_prod.nombre;
      end if;
      v_virtual := least(v_inv.stock_virtual, r.cantidad);
      v_resto   := r.cantidad - v_virtual;

      update public.inventario
         set stock_virtual = stock_virtual - v_virtual,
             stock_fisico  = stock_fisico  - v_resto,
             ultima_salida = now(),
             updated_at    = now()
       where producto_id = r.producto_id;

      insert into public.movimientos_inventario
        (producto_id, tipo, origen, cantidad, stock_antes, stock_despues, notas, referencia_id)
      values
        (r.producto_id, 'salida', 'venta_online', r.cantidad, v_antes, v_antes - r.cantidad,
         'Orden #' || upper(left(v_orden::text, 8)), v_orden);
    end if;
  end loop;

  update public.ordenes set subtotal = v_subtotal, total = v_subtotal where id = v_orden;
  return v_orden;
end;
$$;

revoke execute on function public.crear_orden_tienda(text, text, text, text, text, jsonb) from public;
grant  execute on function public.crear_orden_tienda(text, text, text, text, text, jsonb) to anon, authenticated;

-- 6. Funciones del agente de Telegram -------------------------------------------------------------------------
-- buscar_inventario_admin: busca por nombre o marca (hasta 8). p_ambito: 'venta', 'insumos' o 'todos'.
create or replace function public.buscar_inventario_admin(p_busqueda text, p_ambito text default 'todos')
returns table (producto_id uuid, nombre text, marca text, ambito text, stock_fisico int, stock_virtual int,
               stock_total int, unidad text, umbral_alerta int)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nombre, p.marca,
         case when p.uso_interno then 'insumo' else 'venta' end,
         i.stock_fisico, i.stock_virtual, i.stock_fisico + i.stock_virtual,
         coalesce(i.unidad, 'unidad'), i.umbral_alerta
    from public.productos p
    join public.inventario i on i.producto_id = p.id
   where btrim(coalesce(p_busqueda, '')) <> ''
     and (p.nombre ilike '%' || btrim(p_busqueda) || '%' or p.marca ilike '%' || btrim(p_busqueda) || '%')
     and (coalesce(p_ambito, 'todos') = 'todos'
          or (p_ambito = 'venta' and not p.uso_interno)
          or (p_ambito = 'insumos' and p.uso_interno))
   order by p.nombre
   limit 8;
$$;

-- mover_inventario_admin: p_tipo 'entrada' (llegó producto), 'salida' (se gastó o se vendió) o 'ajuste'
-- (conteo: deja el stock físico en p_cantidad). Con p_aplicar = false solo muestra el resultado sin guardar.
create or replace function public.mover_inventario_admin(
  p_producto uuid, p_tipo text, p_cantidad int, p_origen text default null, p_notas text default null,
  p_aplicar boolean default false)
returns table (ok boolean, mensaje text, producto_nombre text, ambito text, unidad text,
               stock_fisico_antes int, stock_fisico_despues int, aplicado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prod public.productos%rowtype;
  v_inv  public.inventario%rowtype;
  v_antes int;
  v_despues int;
  v_origen text;
  v_cant int;
begin
  if p_tipo not in ('entrada', 'salida', 'ajuste') then
    return query select false, 'El tipo debe ser entrada, salida o ajuste.', null::text, null::text, null::text, null::int, null::int, false; return;
  end if;
  if p_cantidad is null or p_cantidad < 0 or p_cantidad > 100000 or (p_tipo <> 'ajuste' and p_cantidad = 0) then
    return query select false, 'La cantidad no es válida.', null::text, null::text, null::text, null::int, null::int, false; return;
  end if;

  select * into v_prod from public.productos where id = p_producto;
  if not found then
    return query select false, 'No se encontró ese producto.', null::text, null::text, null::text, null::int, null::int, false; return;
  end if;
  select * into v_inv from public.inventario where producto_id = p_producto for update;
  if not found then
    return query select false, 'Ese producto no tiene inventario registrado.', v_prod.nombre, null::text, null::text, null::int, null::int, false; return;
  end if;

  v_antes := v_inv.stock_fisico;
  v_despues := case p_tipo when 'entrada' then v_antes + p_cantidad
                           when 'salida' then v_antes - p_cantidad
                           else p_cantidad end;
  if v_despues < 0 then
    return query select false, format('Solo hay %s en el stock físico; no se puede sacar %s.', v_antes, p_cantidad),
                        v_prod.nombre, case when v_prod.uso_interno then 'insumo' else 'venta' end,
                        coalesce(v_inv.unidad, 'unidad'), v_antes, null::int, false; return;
  end if;

  v_origen := case
    when p_tipo = 'ajuste' then 'ajuste_manual'
    when p_origen = 'consumo_interno' and not v_prod.uso_interno then 'venta_fisica'
    when p_origen in ('compra','venta_fisica','devolucion','ajuste_manual','consumo_interno') then p_origen
    when p_tipo = 'entrada' then 'compra'
    when v_prod.uso_interno then 'consumo_interno'
    else 'venta_fisica' end;
  if v_prod.uso_interno and v_origen in ('venta_fisica','devolucion') then v_origen := 'ajuste_manual'; end if;

  if p_aplicar then
    v_cant := abs(v_despues - v_antes);
    update public.inventario
       set stock_fisico = v_despues,
           ultima_entrada = case when v_despues > v_antes then now() else ultima_entrada end,
           ultima_salida  = case when v_despues < v_antes then now() else ultima_salida end,
           updated_at = now()
     where producto_id = p_producto;
    if v_despues <> v_antes then
      insert into public.movimientos_inventario
        (producto_id, tipo, origen, cantidad, stock_antes, stock_despues, notas)
      values (p_producto, p_tipo, v_origen, v_cant,
              v_antes + v_inv.stock_virtual, v_despues + v_inv.stock_virtual,
              nullif(left(btrim(coalesce(p_notas, '')), 300), ''));
    end if;
  end if;

  return query select true,
    case when p_aplicar then 'Listo.' else 'Vista previa, no se guardó nada.' end,
    v_prod.nombre, case when v_prod.uso_interno then 'insumo' else 'venta' end,
    coalesce(v_inv.unidad, 'unidad'), v_antes, v_despues, p_aplicar;
end;
$$;

revoke all on function public.buscar_inventario_admin(text, text) from public, anon, authenticated;
revoke all on function public.mover_inventario_admin(uuid, text, int, text, text, boolean) from public, anon, authenticated;

commit;

-- Revertir (solo si no hay insumos cargados):
--   begin;
--   drop function if exists public.buscar_inventario_admin(text, text);
--   drop function if exists public.mover_inventario_admin(uuid, text, int, text, text, boolean);
--   drop view if exists public.insumos_completo;
--   (volver a crear inventario_completo sin la línea "where not p.uso_interno" y las políticas de 20261024000003/20260926000001)
--   alter table public.productos drop column uso_interno;
--   commit;
