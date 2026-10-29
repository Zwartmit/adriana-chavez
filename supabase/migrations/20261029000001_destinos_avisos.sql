-- A quién le llega cada aviso de Telegram (Fase E, 29 oct 2026). Idempotente.
--
-- Antes el chat de destino estaba escrito en n8n. Ahora lo decide la base:
--   * Un aviso con destinatario propio (avisos_admin.chat_id) va a esa persona (por ejemplo, "ya tienes acceso").
--   * Un aviso con botones (Recibido / No recibido) va a UNA sola administradora, la "principal": cada botón se
--     reconoce por el mensaje que Telegram le asigna, así que mandarlo a dos personas dejaría solo una funcionando.
--   * Los demás avisos van a todas las administradoras que reciben avisos (usuarios_telegram.recibe_avisos).
--   * Si ninguna administradora recibe avisos, no se pierde nada: se usa la principal.
-- Principal = la administradora activa que recibe avisos y se aprobó más recientemente (así, cuando Adriana se
-- apruebe después de Brandon, ella pasa a ser la principal); si ninguna recibe avisos, la más reciente de las activas.
begin;

create or replace function public.telegram_admin_principal()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select u.chat_id from public.usuarios_telegram u
   where u.estado = 'activo' and u.rol = 'admin'
   order by u.recibe_avisos desc, u.resuelto_en desc nulls last, u.chat_id
   limit 1
$$;

create or replace function public.telegram_destinos_aviso(p_destino bigint, p_con_botones boolean default false)
returns setof bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hay boolean;
begin
  if p_destino is not null then
    return next p_destino;
    return;
  end if;
  if p_con_botones then
    return next public.telegram_admin_principal();
    return;
  end if;
  select exists (select 1 from public.usuarios_telegram u where u.estado = 'activo' and u.rol = 'admin' and u.recibe_avisos) into v_hay;
  if v_hay then
    return query select u.chat_id from public.usuarios_telegram u
                  where u.estado = 'activo' and u.rol = 'admin' and u.recibe_avisos order by u.chat_id;
  else
    return next public.telegram_admin_principal();
  end if;
end;
$$;

revoke execute on function public.telegram_admin_principal() from public, anon, authenticated;
revoke execute on function public.telegram_destinos_aviso(bigint, boolean) from public, anon, authenticated;

commit;

-- Para revertir:
--   drop function if exists public.telegram_destinos_aviso(bigint, boolean), public.telegram_admin_principal();
