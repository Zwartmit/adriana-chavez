-- Rechazar compras de productos sin precio (26 oct 2026). Idempotente.
-- 73 de los 78 productos activos tienen precio 0: sin esta regla, un visitante podía hacer un pedido a $0 y bajar el stock.
-- Es la misma función de 20261024000003 con una validación más. Cuando se carguen los precios, no cambia nada.
begin;

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

commit;
