CREATE OR REPLACE FUNCTION public.eliminar_profesional_si_libre(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bloquea la fila: las citas/bloqueos nuevos que la referencien esperan a que termine
  PERFORM 1 FROM public.profesionales WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.citas WHERE profesional_id = p_id)
     OR EXISTS (SELECT 1 FROM public.bloqueos_horario WHERE profesional_id = p_id) THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.profesionales WHERE id = p_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_profesional_si_libre(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.eliminar_profesional_si_libre(uuid) TO authenticated;