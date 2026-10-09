-- Cola de avisos para Adriana (Telegram): cita nueva, cancelada, reprogramada y escalamiento.
-- Las herramientas del agente de clientes (n8n) escriben aquí; un flujo de n8n envía y marca enviado_en.
create table if not exists public.avisos_admin (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('cita_nueva','cita_cancelada','cita_reprogramada','escalamiento')),
  cita_id uuid references public.citas(id) on delete set null,
  mensaje text not null,
  creado_en timestamptz not null default now(),
  enviado_en timestamptz
);
create index if not exists idx_avisos_admin_pendientes
  on public.avisos_admin (id) where enviado_en is null;
alter table public.avisos_admin enable row level security;
revoke all on public.avisos_admin from anon, authenticated;

-- limpieza diaria: avisos enviados con más de 30 días (3:05 a. m. Colombia)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'limpiar-avisos-admin';
    perform cron.schedule('limpiar-avisos-admin', '5 8 * * *',
      'delete from public.avisos_admin where enviado_en is not null and enviado_en < now() - interval ''30 days''');
  end if;
end;
$$;
