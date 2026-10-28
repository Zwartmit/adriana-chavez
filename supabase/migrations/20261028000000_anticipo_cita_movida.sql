-- Pago por validar y cita movida (28 oct 2026). Idempotente.
--
-- Si una cita con un anticipo por validar cambia de fecha o de duración (la clienta la reprograma por WhatsApp, Adriana la
-- mueve o la alarga desde el panel), la solicitud del anticipo se mantiene al día: su fecha de inicio, su duración y el día en
-- que se cierra sola (7 días después de que termine la cita). Así el recordatorio y el aviso de Recibido / No recibido
-- muestran siempre la fecha real de la cita.
begin;

create or replace function public.sincronizar_solicitud_anticipo_con_cita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fecha_hora is distinct from old.fecha_hora or new.duracion_min is distinct from old.duracion_min then
    update public.solicitudes_anticipo s
       set inicio         = new.fecha_hora,
           duracion_total = coalesce(new.duracion_min, s.duracion_total),
           vence_en       = new.fecha_hora + make_interval(mins => coalesce(new.duracion_min, s.duracion_total)) + interval '7 days'
     where s.cita_id = new.id and s.estado = 'por_confirmar';
  end if;
  return new;
end;
$$;
revoke execute on function public.sincronizar_solicitud_anticipo_con_cita() from public, anon, authenticated;

drop trigger if exists trg_sincronizar_solicitud_anticipo on public.citas;
create trigger trg_sincronizar_solicitud_anticipo
  after update of fecha_hora, duracion_min on public.citas
  for each row execute function public.sincronizar_solicitud_anticipo_con_cita();

commit;

-- ══════════════════════════════════════════════════════════════════
-- REVERSA:
--   drop trigger if exists trg_sincronizar_solicitud_anticipo on public.citas;
--   drop function if exists public.sincronizar_solicitud_anticipo_con_cita();
-- ══════════════════════════════════════════════════════════════════
