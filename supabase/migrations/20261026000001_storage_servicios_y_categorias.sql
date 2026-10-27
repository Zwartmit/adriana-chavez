-- 26 oct 2026. Dos arreglos del panel:
--  1) Subir imagen en Servicios fallaba con "Bucket not found": el bucket `servicios` no existía.
--     Además `productos` existía sin ninguna política, así que subir imágenes de productos también habría fallado.
--     Se crea `servicios` (público, solo imágenes, máx. 5 MB) y se dan a ambos buckets las mismas políticas de `galeria`
--     (solo admin sube, cambia o borra; las URL públicas siguen sirviendo sin política, igual que en `galeria`).
--  2) Categorías de servicios: la tabla solo tenía lectura pública, así que el panel no podía crear, renombrar ni borrar.
--     Se agrega la política de administración (solo admin).
-- Idempotente.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('servicios', 'servicios', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['servicios', 'productos'] loop
    execute format('drop policy if exists %I on storage.objects', 'Admin ' || b || ' Select');
    execute format('drop policy if exists %I on storage.objects', 'Admin ' || b || ' Upload');
    execute format('drop policy if exists %I on storage.objects', 'Admin ' || b || ' Update');
    execute format('drop policy if exists %I on storage.objects', 'Admin ' || b || ' Delete');

    execute format('create policy %I on storage.objects for select to authenticated using (bucket_id = %L and public.es_admin())',
                   'Admin ' || b || ' Select', b);
    execute format('create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and public.es_admin())',
                   'Admin ' || b || ' Upload', b);
    execute format('create policy %I on storage.objects for update to authenticated using (bucket_id = %L and public.es_admin()) with check (bucket_id = %L and public.es_admin())',
                   'Admin ' || b || ' Update', b, b);
    execute format('create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and public.es_admin())',
                   'Admin ' || b || ' Delete', b);
  end loop;
end $$;

drop policy if exists "Admin gestiona categorias servicios" on public.categorias_servicios;
create policy "Admin gestiona categorias servicios" on public.categorias_servicios
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

commit;

-- Rollback (solo si algo falla; ejecutar aparte):
--   drop policy if exists "Admin gestiona categorias servicios" on public.categorias_servicios;
--   drop policy if exists "Admin servicios Select" on storage.objects;  (y Upload, Update, Delete; igual con "Admin productos ...")
--   delete from storage.buckets where id = 'servicios';  -- solo si está vacío
