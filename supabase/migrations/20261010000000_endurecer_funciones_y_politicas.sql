-- Endurecimiento 2 (10 oct 2026): advertencias del Security Advisor.
-- Revisar antes de ejecutar. Idempotente salvo por la política nueva de storage (usa drop if exists antes).
-- Cada bloque es independiente; no toca es_admin()/es_staff() más que para fijar su search_path.

begin;

-- 1. handle_new_user es una función de trigger (auth.users): nadie debe poder llamarla por /rest/v1/rpc.
--    El trigger sigue funcionando: Postgres solo comprueba EXECUTE al crear el trigger, no al dispararlo.
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2. search_path fijo. Los cuerpos ya usan nombres con esquema (public.perfiles, auth.uid()).
alter function public.set_updated_at() set search_path = '';
alter function public.es_admin() set search_path = '';
alter function public.es_staff() set search_path = '';
-- es_admin() y es_staff() siguen ejecutables por anon y authenticated A PROPÓSITO: las políticas RLS
-- las evalúan con el rol de quien consulta. Solo devuelven un booleano sobre el propio usuario.

-- 3. eliminar_profesional_si_libre: hoy cualquier usuario autenticado podía borrar una profesional libre.
--    Ahora exige admin dentro de la función y deja de ser ejecutable por anon/public.
create or replace function public.eliminar_profesional_si_libre(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  -- Bloquea la fila: las citas/bloqueos nuevos que la referencien esperan a que termine
  perform 1 from public.profesionales where id = p_id for update;
  if not found then
    return false;
  end if;

  if exists (select 1 from public.citas where profesional_id = p_id)
     or exists (select 1 from public.bloqueos_horario where profesional_id = p_id) then
    return false;
  end if;

  delete from public.profesionales where id = p_id;
  return true;
end;
$$;
revoke execute on function public.eliminar_profesional_si_libre(uuid) from public, anon;
grant execute on function public.eliminar_profesional_si_libre(uuid) to authenticated;

-- 4. Políticas de UPDATE con WITH CHECK (true): el WITH CHECK pasa a ser igual al USING.
alter policy "Admins pueden modificar ordenes" on public.ordenes
  with check (exists (
    select 1 from public.perfiles
    where perfiles.id = auth.uid() and perfiles.rol = any (array['admin'::text, 'profesional'::text])
  ));

alter policy "Admins pueden modificar items" on public.items_orden
  with check (exists (
    select 1 from public.perfiles
    where perfiles.id = auth.uid() and perfiles.rol = any (array['admin'::text, 'profesional'::text])
  ));

-- 5. Bucket galeria: quitar el SELECT público amplio (permitía listar todos los archivos).
--    Las URL públicas de las imágenes siguen funcionando (un bucket público no necesita política para servir por URL).
--    Se agrega lectura solo para admin, por si el panel necesita listar o borrar.
drop policy if exists "Public galeria Access" on storage.objects;
drop policy if exists "Admin galeria Select" on storage.objects;
create policy "Admin galeria Select" on storage.objects
  for select to authenticated
  using (bucket_id = 'galeria' and public.es_admin());

commit;

-- Rollback (solo si algo falla; ejecutar aparte):
--   alter function public.handle_new_user() reset search_path;
--   grant execute on function public.handle_new_user() to anon, authenticated, public;
--   alter function public.set_updated_at() reset search_path;
--   alter function public.es_admin() reset search_path;
--   alter function public.es_staff() reset search_path;
--   (eliminar_profesional_si_libre: volver a la versión de la migración original)
--   alter policy "Admins pueden modificar ordenes" on public.ordenes with check (true);
--   alter policy "Admins pueden modificar items" on public.items_orden with check (true);
--   create policy "Public galeria Access" on storage.objects for select to public using (bucket_id = 'galeria');
