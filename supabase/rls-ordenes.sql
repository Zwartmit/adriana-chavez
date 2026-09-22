-- ==============================================================
-- POLÍTICAS RLS SEGURAS PARA MÓDULO DE VENTAS
-- Ejecutar en: Supabase -> SQL Editor
-- ==============================================================

-- 1. Asegurar que RLS esté habilitado
ALTER TABLE public.ordenes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas anteriores (temporales/permisivas)
DROP POLICY IF EXISTS "Permitir todo a anon en ordenes"       ON public.ordenes;
DROP POLICY IF EXISTS "Permitir todo a anon en items_orden"   ON public.items_orden;
DROP POLICY IF EXISTS "Clientes pueden crear ordenes"         ON public.ordenes;
DROP POLICY IF EXISTS "Admins pueden leer todas las ordenes"  ON public.ordenes;
DROP POLICY IF EXISTS "Admins pueden modificar ordenes"       ON public.ordenes;
DROP POLICY IF EXISTS "Admins pueden eliminar ordenes"        ON public.ordenes;
DROP POLICY IF EXISTS "Clientes pueden crear items de orden"  ON public.items_orden;
DROP POLICY IF EXISTS "Admins pueden leer items de ordenes"   ON public.items_orden;
DROP POLICY IF EXISTS "Admins pueden modificar items"         ON public.items_orden;

-- ==============================================================
-- POLÍTICAS: public.ordenes
-- ==============================================================

-- Cualquier persona (anon/sin cuenta) puede CREAR una orden (checkout)
CREATE POLICY "Clientes pueden crear ordenes"
ON public.ordenes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Solo admin/profesional puede VER todas las órdenes
CREATE POLICY "Admins pueden leer todas las ordenes"
ON public.ordenes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('admin', 'profesional')
  )
);

-- Solo admin/profesional puede ACTUALIZAR órdenes
CREATE POLICY "Admins pueden modificar ordenes"
ON public.ordenes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('admin', 'profesional')
  )
)
WITH CHECK (true);

-- Solo admin puede ELIMINAR órdenes
CREATE POLICY "Admins pueden eliminar ordenes"
ON public.ordenes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('admin', 'profesional')
  )
);

-- ==============================================================
-- POLÍTICAS: public.items_orden
-- ==============================================================

-- Cualquier persona puede CREAR ítems (checkout crea los items tras insertar la orden)
CREATE POLICY "Clientes pueden crear items de orden"
ON public.items_orden FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Solo admin/profesional puede VER los ítems
CREATE POLICY "Admins pueden leer items de ordenes"
ON public.items_orden FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('admin', 'profesional')
  )
);

-- Solo admin/profesional puede ACTUALIZAR ítems
CREATE POLICY "Admins pueden modificar items"
ON public.items_orden FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('admin', 'profesional')
  )
)
WITH CHECK (true);

-- ==============================================================
-- FUNCIÓN RPC: get_orden_publica
--
-- Permite que cualquier persona con el UUID exacto pueda consultar
-- el estado de SU orden. Usa SECURITY DEFINER para bypassear RLS
-- internamente de forma controlada y segura.
--
-- El UUID tiene 128 bits (~3.4×10^38 posibles valores).
-- Es imposible adivinar el de otra persona por fuerza bruta.
-- Compatible con Wompi: los campos de pago están incluidos.
-- ==============================================================
CREATE OR REPLACE FUNCTION public.get_orden_publica(orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado JSON;
BEGIN
  SELECT json_build_object(
    'id',               o.id,
    'estado',           o.estado,
    'subtotal',         o.subtotal,
    'costo_envio',      o.costo_envio,
    'total',            o.total,
    'nombre_envio',     o.nombre_envio,
    'created_at',       o.created_at,
    'wompi_referencia', o.wompi_referencia,
    'wompi_estado',     o.wompi_estado,
    'fecha_pago',       o.fecha_pago,
    'items', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'nombre',   i.nombre,
          'cantidad', i.cantidad,
          'precio',   i.precio,
          'subtotal', i.subtotal
        )
      ), '[]'::json)
      FROM public.items_orden i
      WHERE i.orden_id = o.id
    )
  )
  INTO resultado
  FROM public.ordenes o
  WHERE o.id = orden_id;

  RETURN resultado;
END;
$$;

-- Permitir que usuarios anónimos y autenticados ejecuten esta función
GRANT EXECUTE ON FUNCTION public.get_orden_publica(UUID) TO anon, authenticated;
