-- Consultas de diagnóstico para correr ANTES de aplicar:
-- (Para ejecutarlas, cópialas y córrelas en el editor SQL de Supabase)

-- (a) Citas ya existentes que se cruzan entre sí para la misma profesional
/*
SELECT c1.id AS cita_1, c2.id AS cita_2, c1.profesional_id, c1.fecha_hora, c2.fecha_hora
FROM public.citas c1
JOIN public.citas c2 ON c1.profesional_id = c2.profesional_id
  AND c1.id < c2.id
  AND c1.estado NOT IN ('cancelada', 'no_asistio')
  AND c2.estado NOT IN ('cancelada', 'no_asistio')
  AND (c1.fecha_hora < c2.fecha_hora + (c2.duracion_min || ' minutes')::interval)
  AND (c1.fecha_hora + (c1.duracion_min || ' minutes')::interval > c2.fecha_hora);
*/

-- (b) Citas futuras que caen dentro de un bloqueo
/*
SELECT c.id AS cita_id, b.id AS bloqueo_id, c.profesional_id, c.fecha_hora, b.fecha_inicio, b.fecha_fin
FROM public.citas c
JOIN public.bloqueos_horario b ON c.profesional_id = b.profesional_id
WHERE c.estado NOT IN ('cancelada', 'no_asistio')
  AND c.fecha_hora >= NOW()
  AND c.fecha_hora < b.fecha_fin
  AND (c.fecha_hora + (c.duracion_min || ' minutes')::interval) > b.fecha_inicio;
*/

CREATE OR REPLACE FUNCTION public.validar_solapamiento_citas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duracion_min integer;
  v_fin_new timestamptz;
BEGIN
  -- Una cita cancelada o no asistida no ocupa lugar
  IF NEW.estado IN ('cancelada', 'no_asistio') THEN
    RETURN NEW;
  END IF;

  -- En UPDATE solo validamos si cambió algo que afecte el horario o si la cita se reactiva
  IF TG_OP = 'UPDATE' THEN
    IF NOT (
         NEW.fecha_hora IS DISTINCT FROM OLD.fecha_hora OR
         NEW.duracion_min IS DISTINCT FROM OLD.duracion_min OR
         NEW.profesional_id IS DISTINCT FROM OLD.profesional_id OR
         NEW.servicio_id IS DISTINCT FROM OLD.servicio_id OR
         (OLD.estado IN ('cancelada', 'no_asistio') AND NEW.estado NOT IN ('cancelada', 'no_asistio'))
       ) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Serializa las operaciones por profesional
  PERFORM pg_advisory_xact_lock(hashtext(NEW.profesional_id::text));

  -- Duración: la de la cita, o la del servicio, o 60 min como último recurso
  v_duracion_min := COALESCE(
    NEW.duracion_min,
    (SELECT s.duracion_min FROM public.servicios s WHERE s.id = NEW.servicio_id),
    60
  );
  v_fin_new := NEW.fecha_hora + make_interval(mins => v_duracion_min);

  -- 1. Contra otras citas activas de la misma profesional
  IF EXISTS (
    SELECT 1
    FROM public.citas c
    WHERE c.profesional_id = NEW.profesional_id
      AND c.id IS DISTINCT FROM NEW.id
      AND c.estado NOT IN ('cancelada', 'no_asistio')
      AND NEW.fecha_hora < c.fecha_hora + make_interval(mins => COALESCE(c.duracion_min, 60))
      AND v_fin_new > c.fecha_hora
  ) THEN
    RAISE EXCEPTION 'La profesional ya tiene una cita en ese horario' USING ERRCODE = '23P01';
  END IF;

  -- 2. Contra bloqueos de horario
  IF EXISTS (
    SELECT 1
    FROM public.bloqueos_horario b
    WHERE b.profesional_id = NEW.profesional_id
      AND NEW.fecha_hora < b.fecha_fin
      AND v_fin_new > b.fecha_inicio
  ) THEN
    RAISE EXCEPTION 'La profesional tiene un bloqueo en ese horario' USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validar_solapamiento_citas() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_validar_solapamiento_citas ON public.citas;
CREATE TRIGGER trigger_validar_solapamiento_citas
BEFORE INSERT OR UPDATE ON public.citas
FOR EACH ROW EXECUTE FUNCTION public.validar_solapamiento_citas();
