-- Quita la columna huérfana clientes.profesional_preferido_id.
-- Ya no la usan ni el panel ni los agentes: la profesional recordada sale de las citas completadas (consulta de buscar_cliente en AC-Clientes).
-- Ejecutar DESPUÉS de desplegar el código que ya no la envía.
ALTER TABLE public.clientes DROP COLUMN IF EXISTS profesional_preferido_id;
