-- Aviso a Adriana de las clientas a quienes ya les toca el retoque (21 oct 2026). Idempotente.
-- El resumen de las 7 am de AC-Admin-Avisos avisa dos veces por cita: 3 días antes y el mismo día.
-- Estas dos columnas guardan cuándo se avisó cada una, para no repetir.
-- Al crear las columnas, las citas que ya pasaron se marcan como avisadas: así el primer día
-- no llega una lista con todas las citas completadas de las últimas semanas.
-- Si se vuelve a ejecutar, no marca nada más (las columnas ya existen).
begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'citas' and column_name = 'aviso_retoque_3d_en'
  ) then
    alter table public.citas
      add column aviso_retoque_3d_en  timestamptz,
      add column aviso_retoque_dia_en timestamptz;

    update public.citas
       set aviso_retoque_3d_en  = now(),
           aviso_retoque_dia_en = now()
     where fecha_hora < now();
  end if;
end;
$$;

comment on column public.citas.aviso_retoque_3d_en  is 'Cuándo se avisó a Adriana, 3 días antes, que a la clienta le toca el retoque de esta cita.';
comment on column public.citas.aviso_retoque_dia_en is 'Cuándo se avisó a Adriana, el día del retoque, que a la clienta le toca el retoque de esta cita.';

commit;
