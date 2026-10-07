CREATE TABLE IF NOT EXISTS public.mensajes_entrantes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  telefono text NOT NULL,
  texto text NOT NULL,
  procesado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_entrantes_pendientes
  ON public.mensajes_entrantes (telefono, id) WHERE NOT procesado;

ALTER TABLE public.mensajes_entrantes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mensajes_entrantes FROM anon, authenticated;

-- Limpieza diaria de mensajes con más de 7 días (3 a. m. hora Colombia)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'limpiar-mensajes-entrantes';
    PERFORM cron.schedule('limpiar-mensajes-entrantes', '0 8 * * *',
      'DELETE FROM public.mensajes_entrantes WHERE created_at < now() - interval ''7 days''');
  END IF;
END;
$$;