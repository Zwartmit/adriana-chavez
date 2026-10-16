-- Retención de datos personales (Ley 1581 de 2012: no conservar datos más tiempo del necesario).
-- Política acordada el 16 oct 2026:
--   * n8n_chat_histories (conversaciones con clientas y con el panel admin): 90 días.
--   * escalaciones cerradas (resuelta / vencida; contienen teléfono y motivo): 180 días.
-- Ya existentes: mensajes_entrantes (7 días) y avisos_admin enviados (30 días).

-- 1) n8n_chat_histories no tenía fecha (solo id, session_id y message). La columna nueva
--    tiene valor por defecto, así que el nodo de memoria de n8n y los INSERT existentes
--    siguen funcionando sin cambios. Las filas que ya existen quedan con la fecha de hoy
--    (su 90 días empieza a contar desde esta migración).
ALTER TABLE public.n8n_chat_histories
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS n8n_chat_histories_created_at_idx
  ON public.n8n_chat_histories (created_at);

-- 2) Limpieza diaria (a. m. hora Colombia: 3:10 y 3:15; el cron corre en UTC).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'limpiar-chat-historial';
    PERFORM cron.schedule('limpiar-chat-historial', '10 8 * * *',
      'DELETE FROM public.n8n_chat_histories WHERE created_at < now() - interval ''90 days''');

    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'limpiar-escalaciones-cerradas';
    PERFORM cron.schedule('limpiar-escalaciones-cerradas', '15 8 * * *',
      'DELETE FROM public.escalaciones WHERE estado IN (''resuelta'', ''vencida'') AND cerrada_en < now() - interval ''180 days''');
  END IF;
END;
$$;
