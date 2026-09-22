-- Habilitar RLS explícitamente en ambas tablas
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Permitir todo a anon en ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Permitir todo a anon en items_orden" ON public.items_orden;

-- Crear políticas para permitir lectura/escritura pública (asumiendo que así está diseñado el checkout)
CREATE POLICY "Permitir todo a anon en ordenes"
ON public.ordenes
FOR ALL
TO public, anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en items_orden"
ON public.items_orden
FOR ALL
TO public, anon, authenticated
USING (true)
WITH CHECK (true);
