-- 1. Al pasar una cita a 'completada' sin precio cobrado, copiar el precio del servicio
CREATE OR REPLACE FUNCTION public.asignar_precio_cobrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'completada'
     AND NEW.precio_cobrado IS NULL
     AND NEW.servicio_id IS NOT NULL THEN
    NEW.precio_cobrado := (SELECT s.precio FROM public.servicios s WHERE s.id = NEW.servicio_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.asignar_precio_cobrado() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_asignar_precio_cobrado ON public.citas;
CREATE TRIGGER trigger_asignar_precio_cobrado
  BEFORE INSERT OR UPDATE OF estado ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.asignar_precio_cobrado();

-- 2. Rellenar el precio de las citas que ya están completadas sin precio
UPDATE public.citas c
SET precio_cobrado = s.precio
FROM public.servicios s
WHERE s.id = c.servicio_id
  AND c.estado = 'completada'
  AND c.precio_cobrado IS NULL;

-- 3. Completar automáticamente las citas cuya hora de fin ya pasó
CREATE OR REPLACE FUNCTION public.completar_citas_vencidas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
BEGIN
  WITH upd AS (
    UPDATE public.citas
    SET estado = 'completada'
    WHERE estado IN ('pendiente', 'confirmada', 'en_proceso')
      AND fecha_hora + make_interval(mins => COALESCE(duracion_min, 60)) < NOW()
    RETURNING 1
  )
  SELECT count(*) INTO v_total FROM upd;
  RETURN v_total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.completar_citas_vencidas() FROM PUBLIC, anon, authenticated;

-- 4. Programarla cada 10 minutos (solo si pg_cron está habilitado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'completar-citas-vencidas';
    PERFORM cron.schedule('completar-citas-vencidas', '*/10 * * * *',
                          'SELECT public.completar_citas_vencidas()');
  ELSE
    RAISE NOTICE 'pg_cron no está habilitado: la función existe pero no está programada.';
  END IF;
END;
$$;