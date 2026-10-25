-- Endurecimiento 4 (24 oct 2026): permisos mínimos sobre las tablas. Idempotente.
-- Supabase da por defecto todos los permisos a anon y authenticated y deja a RLS como única defensa.
-- Aquí se quitan los que ninguna pantalla usa. RLS sigue igual: esto es una segunda capa.
--   · Para todos (anon y authenticated): TRUNCATE, REFERENCES y TRIGGER (RLS no los controla).
--   · anon (visitante sin sesión): solo lo que usa el sitio público.
--       leer: servicios, adicionales, vínculos, categorías, profesionales, productos, galería, testimonios
--       escribir: crear órdenes e ítems (el carrito) y mensajes de contacto
--   · authenticated conserva SELECT/INSERT/UPDATE/DELETE, limitados por las políticas de cada tabla.
-- Probar después: inicio, servicios, tienda (catálogo, producto, carrito y pago), galería, contacto, y entrar al panel.
begin;

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;

-- anon sin ningún permiso en tablas privadas
revoke all on public.bloqueos_horario, public.cita_adicionales, public.citas, public.clientes, public.inventario,
              public.movimientos_inventario, public.perfiles, public.reportes_caja from anon;

-- anon solo lee contenido público
revoke insert, update, delete on public.adicionales, public.servicio_adicionales, public.categorias_galeria,
              public.categorias_productos, public.categorias_servicios, public.galeria, public.productos,
              public.profesionales, public.servicios, public.testimonios from anon;

-- anon solo crea mensajes de contacto (el formulario no lee lo que inserta)
revoke select, update, delete on public.mensajes_contacto from anon;

-- Órdenes e ítems: el carrito del sitio los crea sin sesión y lee el id de la orden recién creada (.insert().select()),
-- así que aquí solo se quita lo que nunca se usa sin sesión.
revoke update, delete on public.ordenes, public.items_orden from anon;

commit;

-- Reversa de una tabla concreta (ejemplo): grant select, insert, update, delete on public.servicios to anon;
