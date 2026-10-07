ALTER TABLE public.citas
  DROP CONSTRAINT IF EXISTS citas_estilista_id_fkey,
  DROP CONSTRAINT IF EXISTS citas_profesional_id_fkey,
  ADD CONSTRAINT citas_profesional_id_fkey
    FOREIGN KEY (profesional_id)
    REFERENCES public.profesionales(id)
    ON DELETE RESTRICT;