CREATE OR REPLACE FUNCTION public.asignar_precio_cobrado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.estado IN ('cancelada', 'no_asistio') THEN
    NEW.precio_cobrado := NULL;
  ELSIF NEW.estado = 'completada'
     AND NEW.precio_cobrado IS NULL
     AND NEW.servicio_id IS NOT NULL THEN
    NEW.precio_cobrado := (SELECT s.precio FROM public.servicios s WHERE s.id = NEW.servicio_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Limpieza de datos existentes
UPDATE public.citas SET precio_cobrado = NULL
WHERE estado IN ('cancelada', 'no_asistio') AND precio_cobrado IS NOT NULL;
