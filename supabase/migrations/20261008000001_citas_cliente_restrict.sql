-- Evita que borrar una clienta elimine su historial de citas.
-- El panel ya bloquea el borrado si hay citas; esto protege también
-- el resto de vías (SQL, dashboard de Supabase, código futuro).
ALTER TABLE public.citas
  DROP CONSTRAINT citas_cliente_id_fkey,
  ADD CONSTRAINT citas_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
    ON DELETE RESTRICT;