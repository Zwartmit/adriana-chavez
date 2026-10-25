  -- Endurecimiento 3 (24 oct 2026): revisión de políticas y Security Advisor. Idempotente.
  -- 1. perfiles: la política "Usuario actualiza su propio perfil" no tenía WITH CHECK y la tabla permite actualizar
  --    cualquier columna, así que un usuario con sesión podía cambiarse el rol a 'admin' (PATCH /rest/v1/perfiles).
  --    Ahora: la política exige authenticated con WITH CHECK, y un trigger impide cambiar el rol a quien no sea admin.
  -- 2. galeria: "Lectura publica galeria" (using true) dejaba ver a cualquiera las imágenes inactivas; queda solo
  --    "Galería activa es pública".
  -- 3. Funciones de trigger: no deben poder llamarse por /rest/v1/rpc (el trigger sigue funcionando).
  -- 4. saldo_clienta: un usuario con sesión que no sea staff ya no puede consultar el saldo de una clienta.
  --    n8n y el SQL Editor (sin auth.uid()) siguen igual.
  begin;

  -- 1. perfiles ------------------------------------------------------------------------------------------------
  drop policy if exists "Usuario actualiza su propio perfil" on public.perfiles;
  create policy "Usuario actualiza su propio perfil" on public.perfiles
    for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

  create or replace function public.proteger_rol_perfil()
  returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    if new.rol is distinct from old.rol and auth.uid() is not null and not public.es_admin() then
      raise exception 'No autorizado para cambiar el rol' using errcode = '42501';
    end if;
    return new;
  end;
  $$;
  revoke execute on function public.proteger_rol_perfil() from public, anon, authenticated;

  drop trigger if exists proteger_rol_perfil on public.perfiles;
  create trigger proteger_rol_perfil
    before update on public.perfiles
    for each row execute function public.proteger_rol_perfil();

  -- 2. galeria -------------------------------------------------------------------------------------------------
  drop policy if exists "Lectura publica galeria" on public.galeria;

  -- 3. funciones de trigger ------------------------------------------------------------------------------------
  revoke execute on function public.trg_acreditar_anticipo_cancelacion() from public, anon, authenticated;
  revoke execute on function public.trg_validar_movimiento_saldo() from public, anon, authenticated;
  revoke execute on function public.set_updated_at() from public, anon, authenticated;
  alter function public.trg_validar_movimiento_saldo() set search_path = public;

  -- 4. saldo_clienta -------------------------------------------------------------------------------------------
  create or replace function public.saldo_clienta(p_cliente_id uuid)
  returns numeric
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select case
            when auth.uid() is not null and not public.es_staff() then 0
            else coalesce((select sum(m.monto) from public.movimientos_saldo m where m.cliente_id = p_cliente_id), 0)
          end;
  $$;
  revoke execute on function public.saldo_clienta(uuid) from public, anon;
  grant  execute on function public.saldo_clienta(uuid) to authenticated;

  commit;

  -- Reversa (no recomendada):
  --   drop trigger if exists proteger_rol_perfil on public.perfiles;
  --   drop function if exists public.proteger_rol_perfil();
  --   create policy "Lectura publica galeria" on public.galeria for select to public using (true);
