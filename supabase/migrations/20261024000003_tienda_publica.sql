-- Tienda pública (24 oct 2026). Idempotente.
-- Problemas que corrige (comprobados en base local con el rol anon, el del visitante sin sesión):
--  1. Los productos se piden con el stock embebido (inventario(stock_virtual, stock_fisico)). Tras
--     20261024000002_minimos_permisos.sql el visitante ya no tiene permiso sobre inventario y la consulta falla
--     ("permission denied for table inventario"). Antes no fallaba, pero RLS le ocultaba el stock y nunca salía "agotado".
--     Ahora el visitante lee solo 3 columnas (producto_id, stock_virtual, stock_fisico) y solo de productos activos.
--  2. El pedido de un visitante nunca pudo funcionar: el carrito hace insert(...).select("id") y la política de órdenes
--     no deja leer de vuelta la fila recién creada. Además el carrito descontaba el stock desde el navegador (RLS lo
--     bloqueaba en silencio) y confiaba en el precio que mandaba el navegador.
--     Ahora el pedido pasa por crear_orden_tienda(): valida, toma nombre y precio de la base, descuenta el stock y
--     registra el movimiento en una sola transacción (si algo falla, no queda nada a medias).
--  3. Se cierran las inserciones directas de visitantes en ordenes e items_orden (quedan solo vía la función).
--     El personal (es_staff) conserva la inserción directa que usa el panel.
-- Regla de stock elegida: la venta online descuenta primero de stock_virtual y el resto de stock_fisico, y se rechaza
-- si no alcanza (stock_virtual + stock_fisico es lo que la tienda ya usa para mostrar "agotado").
begin;

-- 1. Stock legible por visitantes (3 columnas, solo productos activos) -------------------------------------
grant select (producto_id, stock_virtual, stock_fisico) on public.inventario to anon;

drop policy if exists "Stock visible al publico" on public.inventario;
create policy "Stock visible al publico" on public.inventario
  for select to anon
  using (exists (select 1 from public.productos p where p.id = inventario.producto_id and p.activo));

-- 2. Pedido de la tienda ----------------------------------------------------------------------------------
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
      from public.productos where id = r.producto_id and activo;
    if not found then
      raise exception 'Un producto del carrito ya no está disponible.';
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

-- 3. Cerrar las inserciones directas de visitantes ----------------------------------------------------------
drop policy if exists "Clientes pueden crear ordenes" on public.ordenes;
drop policy if exists "Clientes pueden crear items de orden" on public.items_orden;
revoke all on public.ordenes, public.items_orden from anon;

-- El panel (NuevaOrdenPanel) inserta órdenes e ítems como personal con sesión.
drop policy if exists "Staff crea ordenes" on public.ordenes;
create policy "Staff crea ordenes" on public.ordenes
  for insert to authenticated with check (public.es_staff());

drop policy if exists "Staff crea items de orden" on public.items_orden;
create policy "Staff crea items de orden" on public.items_orden
  for insert to authenticated with check (public.es_staff());

commit;

-- Reversa (no recomendada):
--   drop function if exists public.crear_orden_tienda(text, text, text, text, text, jsonb);
--   create policy "Clientes pueden crear ordenes" on public.ordenes for insert to anon, authenticated with check (true);
--   create policy "Clientes pueden crear items de orden" on public.items_orden for insert to anon, authenticated with check (true);
--   grant select, insert on public.ordenes, public.items_orden to anon;
