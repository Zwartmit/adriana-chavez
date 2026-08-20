-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Adriana Chávez
-- Ejecutar DESPUÉS de schema.sql
-- ══════════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estilistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueos_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_caja ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────
-- Helper: verificar si el usuario es admin o estilista
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.es_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol IN ('admin', 'estilista')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ──────────────────────────────────────────────────────────────────
-- PERFILES
-- ──────────────────────────────────────────────────────────────────
CREATE POLICY "Usuario ve su propio perfil"
  ON public.perfiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin ve todos los perfiles"
  ON public.perfiles FOR SELECT
  USING (public.es_admin());

CREATE POLICY "Usuario actualiza su propio perfil"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────────
-- DATOS PÚBLICOS (lectura sin auth)
-- ──────────────────────────────────────────────────────────────────

-- Servicios activos — cualquiera puede leer
CREATE POLICY "Servicios activos son públicos"
  ON public.servicios FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Staff gestiona servicios"
  ON public.servicios FOR ALL
  USING (public.es_staff());

-- Categorías — públicas
CREATE POLICY "Categorías servicios son públicas"
  ON public.categorias_servicios FOR SELECT
  USING (TRUE);

CREATE POLICY "Categorías productos son públicas"
  ON public.categorias_productos FOR SELECT
  USING (TRUE);

-- Estilistas activos — públicos
CREATE POLICY "Estilistas activos son públicos"
  ON public.estilistas FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Admin gestiona estilistas"
  ON public.estilistas FOR ALL
  USING (public.es_admin());

-- Productos activos — públicos
CREATE POLICY "Productos activos son públicos"
  ON public.productos FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Admin gestiona productos"
  ON public.productos FOR ALL
  USING (public.es_admin());

-- Galería activa — pública
CREATE POLICY "Galería activa es pública"
  ON public.galeria FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Admin gestiona galería"
  ON public.galeria FOR ALL
  USING (public.es_admin());

-- Testimonios aprobados — públicos
CREATE POLICY "Testimonios aprobados son públicos"
  ON public.testimonios FOR SELECT
  USING (aprobado = TRUE);

CREATE POLICY "Admin gestiona testimonios"
  ON public.testimonios FOR ALL
  USING (public.es_admin());

-- ──────────────────────────────────────────────────────────────────
-- DATOS PRIVADOS (solo staff)
-- ──────────────────────────────────────────────────────────────────

-- Clientes — solo staff
CREATE POLICY "Staff ve todos los clientes"
  ON public.clientes FOR SELECT
  USING (public.es_staff());

CREATE POLICY "Staff gestiona clientes"
  ON public.clientes FOR ALL
  USING (public.es_staff());

-- Cliente ve su propio registro
CREATE POLICY "Cliente ve su propio registro"
  ON public.clientes FOR SELECT
  USING (perfil_id = auth.uid());

-- Citas — staff ve todas, cliente ve las suyas
CREATE POLICY "Staff ve todas las citas"
  ON public.citas FOR SELECT
  USING (public.es_staff());

CREATE POLICY "Staff gestiona citas"
  ON public.citas FOR ALL
  USING (public.es_staff());

CREATE POLICY "Cliente ve sus citas"
  ON public.citas FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE perfil_id = auth.uid()
    )
  );

-- Bloqueos — solo staff
CREATE POLICY "Staff gestiona bloqueos"
  ON public.bloqueos_horario FOR ALL
  USING (public.es_staff());

-- Inventario — solo staff
CREATE POLICY "Staff ve inventario"
  ON public.inventario FOR SELECT
  USING (public.es_staff());

CREATE POLICY "Admin gestiona inventario"
  ON public.inventario FOR ALL
  USING (public.es_admin());

-- Movimientos — solo staff
CREATE POLICY "Staff ve movimientos"
  ON public.movimientos_inventario FOR SELECT
  USING (public.es_staff());

CREATE POLICY "Admin gestiona movimientos"
  ON public.movimientos_inventario FOR ALL
  USING (public.es_admin());

-- Órdenes — admin ve todas, cliente ve las suyas
CREATE POLICY "Admin ve todas las órdenes"
  ON public.ordenes FOR SELECT
  USING (public.es_admin());

CREATE POLICY "Admin gestiona órdenes"
  ON public.ordenes FOR ALL
  USING (public.es_admin());

CREATE POLICY "Cliente ve sus órdenes"
  ON public.ordenes FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE perfil_id = auth.uid()
    )
  );

-- Items de orden — siguen la política de la orden
CREATE POLICY "Admin ve items de orden"
  ON public.items_orden FOR SELECT
  USING (public.es_admin());

CREATE POLICY "Cliente ve sus items"
  ON public.items_orden FOR SELECT
  USING (
    orden_id IN (
      SELECT o.id FROM public.ordenes o
      JOIN public.clientes c ON c.id = o.cliente_id
      WHERE c.perfil_id = auth.uid()
    )
  );

-- Reportes de caja — solo admin
CREATE POLICY "Admin ve reportes de caja"
  ON public.reportes_caja FOR ALL
  USING (public.es_admin());

-- Mensajes de contacto — cualquiera envía, solo admin lee/actualiza
ALTER TABLE public.mensajes_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede enviar mensaje"
  ON public.mensajes_contacto FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solo admin lee mensajes"
  ON public.mensajes_contacto FOR SELECT
  USING (public.es_admin());

CREATE POLICY "Solo admin actualiza mensajes"
  ON public.mensajes_contacto FOR UPDATE
  USING (public.es_admin());
