-- Formato legible para los avisos de citas que se envían a Adriana por Telegram.
-- Devuelve, en hora de Bogotá y con am/pm, algo como: "sábado 10/10 de 8:00 am a 12:00 pm".
-- Lo usan las herramientas agendar_cita, cancelar_cita y reprogramar_cita del agente de clientes.
-- Función pura (no lee ni escribe tablas); solo la ejecuta n8n, que se conecta como postgres.

create or replace function public.formato_cita_aviso(p_inicio timestamptz, p_duracion_min int)
returns text
language sql
stable
set search_path = ''
as $$
  select (array['domingo','lunes','martes','miércoles','jueves','viernes','sábado'])
           [extract(dow from p_inicio at time zone 'America/Bogota')::int + 1]
    || ' ' || to_char(p_inicio at time zone 'America/Bogota', 'DD/MM')
    || ' de ' || to_char(p_inicio at time zone 'America/Bogota', 'FMHH12:MI am')
    || ' a ' || to_char(
         (p_inicio + make_interval(mins => coalesce(p_duracion_min, 60))) at time zone 'America/Bogota',
         'FMHH12:MI am'
       );
$$;

revoke execute on function public.formato_cita_aviso(timestamptz, int) from public, anon, authenticated;
