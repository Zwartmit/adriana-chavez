-- Limpieza de políticas (24 oct 2026). Idempotente.
-- CORRECCIÓN URGENTE incluida: "Admin galeria" y "Admin categorias galeria" consultaban la tabla perfiles directamente.
-- Como las políticas se evalúan todas, al visitante (anon) le fallaba con "permission denied for table perfiles" desde que
-- 20261024000002 le quitó el acceso a perfiles, y la galería pública (y la de la página de inicio) no cargaba.
-- Aquí "Admin galeria" se elimina (la cubre "Admin gestiona galería", que usa es_admin()) y "Admin categorias galeria"
-- se reemplaza por una equivalente con es_admin(), que sí puede ejecutar el visitante.
-- Las políticas de RLS se suman (basta que una permita). Estas ya estaban cubiertas por otra más amplia:
--   · galeria:     "Admin galeria" repite a "Admin gestiona galería" (es_admin()).
--   · citas:       "Staff ve todas las citas" está dentro de "Staff gestiona citas" (ALL con es_staff()).
--   · clientes:    "Staff ve todos los clientes" está dentro de "Staff gestiona clientes" (ALL con es_staff()).
--   · ordenes:     "Admin ve todas las órdenes" está dentro de "Admin gestiona órdenes" (ALL con es_admin()).
--   · items_orden: "Admin ve items de orden" está dentro de "Admins pueden leer items de ordenes" (admin y profesional).
-- Único cambio de acceso: "Admins pueden eliminar ordenes" también dejaba borrar órdenes al rol profesional, y la
-- migración que la creó decía "solo admin puede eliminar órdenes". Borrar queda solo para admin ("Admin gestiona órdenes").
-- El rol profesional sigue leyendo y modificando órdenes e ítems como hasta ahora.
begin;

drop policy if exists "Admin galeria"                    on public.galeria;
drop policy if exists "Admin categorias galeria"         on public.categorias_galeria;
drop policy if exists "Admin gestiona categorias galeria" on public.categorias_galeria;
create policy "Admin gestiona categorias galeria" on public.categorias_galeria
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "Staff ve todas las citas"         on public.citas;
drop policy if exists "Staff ve todos los clientes"      on public.clientes;
drop policy if exists "Admin ve todas las órdenes"       on public.ordenes;
drop policy if exists "Admin ve items de orden"          on public.items_orden;
drop policy if exists "Admins pueden eliminar ordenes"   on public.ordenes;

commit;
