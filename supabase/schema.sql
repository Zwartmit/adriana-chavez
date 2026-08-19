-- ══════════════════════════════════════════════════════════════════
-- ADRIANA CHÁVEZ — SALÓN DE BELLEZA
-- Schema completo de base de datos
-- Ejecutar en: Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda de texto

-- ──────────────────────────────────────────────────────────────────
-- TABLA: perfiles (extiende auth.users de Supabase)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  rol         TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'estilista', 'cliente')),
  nombre      TEXT,
  telefono    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.perfiles IS 'Extensión de auth.users con rol y datos básicos del usuario';

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────
-- TABLA: estilistas
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estilistas (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfil_id       UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  nombre          TEXT NOT NULL,
  cargo           TEXT NOT NULL DEFAULT 'Estilista',
  especialidades  TEXT[] DEFAULT '{}',
  bio             TEXT,
  foto_url        TEXT,
  anos_experiencia INTEGER DEFAULT 0,
  color_calendario TEXT DEFAULT '#1C3D35', -- Color en el calendario de citas
  activo          BOOLEAN DEFAULT TRUE,
  orden           INTEGER DEFAULT 0, -- Para ordenar en la página
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.estilistas IS 'Equipo de estilistas del salón';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: categorias_servicios
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias_servicios (
  id      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE,
  slug    TEXT NOT NULL UNIQUE,
  orden   INTEGER DEFAULT 0
);

INSERT INTO public.categorias_servicios (nombre, slug, orden) VALUES
  ('Cabello', 'cabello', 1),
  ('Color', 'color', 2),
  ('Tratamiento', 'tratamiento', 3),
  ('Uñas', 'unas', 4),
  ('Peinado', 'peinado', 5)
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────
-- TABLA: servicios
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.servicios (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  categoria_id    UUID REFERENCES public.categorias_servicios(id),
  nombre          TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  descripcion     TEXT,
  duracion_min    INTEGER NOT NULL DEFAULT 60, -- En minutos
  precio          NUMERIC(12, 0) NOT NULL,
  precio_desde    BOOLEAN DEFAULT FALSE, -- Si el precio es "desde X"
  imagen_url      TEXT,
  requiere_cita   BOOLEAN DEFAULT TRUE,
  activo          BOOLEAN DEFAULT TRUE,
  destacado       BOOLEAN DEFAULT FALSE, -- Para mostrar en el Home
  orden           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.servicios IS 'Catálogo de servicios del salón';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: clientes (CRM básico)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfil_id       UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  nombre          TEXT NOT NULL,
  apellido        TEXT,
  email           TEXT UNIQUE,
  telefono        TEXT,
  fecha_nacimiento DATE,
  -- Campos del CRM
  notas           TEXT, -- Notas generales del estilista
  alergias        TEXT, -- Alergias o sensibilidades conocidas
  preferencias    TEXT, -- Preferencias de productos o técnicas
  estilista_preferido_id UUID REFERENCES public.estilistas(id) ON DELETE SET NULL,
  -- Consentimiento Ley 1581
  acepta_datos    BOOLEAN DEFAULT FALSE,
  fecha_acepta    TIMESTAMPTZ,
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clientes IS 'CRM de clientes del salón. Incluye campos de privacidad según Ley 1581';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: citas
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.citas (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id      UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  estilista_id    UUID REFERENCES public.estilistas(id) ON DELETE SET NULL,
  servicio_id     UUID REFERENCES public.servicios(id) ON DELETE SET NULL,
  fecha_hora      TIMESTAMPTZ NOT NULL,
  duracion_min    INTEGER NOT NULL DEFAULT 60,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_asistio')),
  precio_cobrado  NUMERIC(12, 0),
  notas_cliente   TEXT, -- Lo que el cliente solicitó
  notas_internas  TEXT, -- Notas privadas del estilista
  canal_origen    TEXT DEFAULT 'web'
                  CHECK (canal_origen IN ('web', 'whatsapp', 'telefono', 'presencial')),
  recordatorio_24h_enviado  BOOLEAN DEFAULT FALSE,
  recordatorio_2h_enviado   BOOLEAN DEFAULT FALSE,
  seguimiento_enviado       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.citas IS 'Calendario de citas. Los campos de recordatorio los gestiona el agente de IA';

-- Índices para el calendario
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estilista ON public.citas(estilista_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(estado);

-- ──────────────────────────────────────────────────────────────────
-- TABLA: bloqueos_horario
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bloqueos_horario (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estilista_id  UUID REFERENCES public.estilistas(id) ON DELETE CASCADE,
  fecha_inicio  TIMESTAMPTZ NOT NULL,
  fecha_fin     TIMESTAMPTZ NOT NULL,
  motivo        TEXT,
  created_by    UUID REFERENCES public.perfiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bloqueos_horario IS 'Bloqueos de horario en el calendario. El agente de IA puede crear estos registros';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: categorias_productos
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias_productos (
  id      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE,
  slug    TEXT NOT NULL UNIQUE,
  orden   INTEGER DEFAULT 0
);

INSERT INTO public.categorias_productos (nombre, slug, orden) VALUES
  ('Cuidado capilar', 'cuidado-capilar', 1),
  ('Coloración', 'coloracion', 2),
  ('Tratamientos', 'tratamientos', 3),
  ('Estilizado', 'estilizado', 4),
  ('Uñas', 'unas', 5),
  ('Accesorios', 'accesorios', 6)
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────
-- TABLA: productos (tienda virtual)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  categoria_id      UUID REFERENCES public.categorias_productos(id),
  nombre            TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  marca             TEXT NOT NULL,
  descripcion       TEXT,
  descripcion_larga TEXT,
  caracteristicas   JSONB DEFAULT '{}', -- Ej: {"contenido": "250ml", "tipo": "Todo tipo"}
  precio            NUMERIC(12, 0) NOT NULL,
  precio_original   NUMERIC(12, 0), -- Para mostrar descuento
  imagenes          TEXT[] DEFAULT '{}', -- URLs de imágenes
  rating            NUMERIC(3, 2) DEFAULT 0,
  total_resenas     INTEGER DEFAULT 0,
  es_nuevo          BOOLEAN DEFAULT FALSE,
  destacado         BOOLEAN DEFAULT FALSE,
  activo            BOOLEAN DEFAULT TRUE,
  orden             INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.productos IS 'Catálogo de productos de la tienda virtual';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: inventario
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventario (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  producto_id         UUID REFERENCES public.productos(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stock_virtual       INTEGER NOT NULL DEFAULT 0, -- Stock tienda online
  stock_fisico        INTEGER NOT NULL DEFAULT 0, -- Stock físico del salón
  umbral_alerta       INTEGER NOT NULL DEFAULT 5, -- Alerta cuando baje de este número
  unidad              TEXT DEFAULT 'unidad',
  ultima_entrada      TIMESTAMPTZ,
  ultima_salida       TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.inventario IS 'Stock unificado (virtual + físico). El agente de IA monitorea el umbral_alerta';

-- Vista de inventario con info del producto
CREATE OR REPLACE VIEW public.inventario_completo AS
SELECT
  i.*,
  p.nombre AS producto_nombre,
  p.marca AS producto_marca,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  (i.stock_virtual + i.stock_fisico) AS stock_total,
  CASE
    WHEN (i.stock_virtual + i.stock_fisico) = 0 THEN 'agotado'
    WHEN (i.stock_virtual + i.stock_fisico) <= i.umbral_alerta THEN 'critico'
    ELSE 'disponible'
  END AS estado_stock
FROM public.inventario i
JOIN public.productos p ON p.id = i.producto_id
JOIN public.categorias_productos c ON c.id = p.categoria_id;

-- ──────────────────────────────────────────────────────────────────
-- TABLA: movimientos_inventario
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  origen      TEXT CHECK (origen IN ('compra', 'venta_online', 'venta_fisica', 'devolucion', 'ajuste_manual')),
  cantidad    INTEGER NOT NULL,
  stock_antes INTEGER NOT NULL,
  stock_despues INTEGER NOT NULL,
  notas       TEXT,
  referencia_id UUID, -- ID de la orden si aplica
  created_by  UUID REFERENCES public.perfiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.movimientos_inventario IS 'Historial de todos los movimientos de inventario';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: ordenes (tienda virtual)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ordenes (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id        UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'pagada', 'en_preparacion', 'enviada', 'entregada', 'cancelada', 'reembolsada')),
  subtotal          NUMERIC(12, 0) NOT NULL,
  costo_envio       NUMERIC(12, 0) DEFAULT 0,
  total             NUMERIC(12, 0) NOT NULL,
  -- Datos de envío
  nombre_envio      TEXT,
  telefono_envio    TEXT,
  direccion_envio   TEXT,
  ciudad_envio      TEXT,
  -- Pago Wompi
  wompi_referencia  TEXT UNIQUE,
  wompi_estado      TEXT,
  wompi_metodo      TEXT,
  fecha_pago        TIMESTAMPTZ,
  -- Notas
  notas_cliente     TEXT,
  notas_internas    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────
-- TABLA: items_orden
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.items_orden (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  orden_id    UUID REFERENCES public.ordenes(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre      TEXT NOT NULL, -- Snapshot del nombre al momento de la compra
  precio      NUMERIC(12, 0) NOT NULL, -- Snapshot del precio
  cantidad    INTEGER NOT NULL DEFAULT 1,
  subtotal    NUMERIC(12, 0) NOT NULL
);

-- ──────────────────────────────────────────────────────────────────
-- TABLA: testimonios
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonios (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id  UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  nombre      TEXT NOT NULL, -- Puede ser diferente al del cliente (privacidad)
  servicio    TEXT,
  texto       TEXT NOT NULL,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  desde_anio  INTEGER, -- "Clienta desde 2021"
  aprobado    BOOLEAN DEFAULT FALSE, -- Solo se muestran los aprobados
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.testimonios IS 'Testimonios de clientes. Solo se muestran los aprobados (aprobado = true)';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: galeria
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.galeria (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo      TEXT,
  categoria   TEXT NOT NULL CHECK (categoria IN ('antes-despues', 'coloracion', 'corte', 'tratamiento', 'unas', 'peinado')),
  tag         TEXT, -- Ej: "Balayage", "Bob moderno"
  imagen_url  TEXT NOT NULL,
  imagen_antes_url TEXT, -- Para la categoría antes-despues
  destacado   BOOLEAN DEFAULT FALSE,
  activo      BOOLEAN DEFAULT TRUE,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.galeria IS 'Portafolio de trabajos del salón';

-- ──────────────────────────────────────────────────────────────────
-- TABLA: reportes_caja (para el agente de IA)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reportes_caja (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fecha             DATE NOT NULL UNIQUE,
  ingresos_servicios NUMERIC(12, 0) DEFAULT 0,
  ingresos_productos NUMERIC(12, 0) DEFAULT 0,
  total_ingresos    NUMERIC(12, 0) DEFAULT 0,
  total_citas       INTEGER DEFAULT 0,
  citas_completadas INTEGER DEFAULT 0,
  citas_canceladas  INTEGER DEFAULT 0,
  generado_por      TEXT DEFAULT 'sistema',
  notas             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reportes_caja IS 'Cierre de caja diario. El agente de IA genera este reporte automáticamente';

-- ──────────────────────────────────────────────────────────────────
-- FUNCIÓN: updated_at automático
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at a todas las tablas que lo necesitan
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'perfiles', 'estilistas', 'servicios', 'clientes',
    'citas', 'productos', 'inventario', 'ordenes'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER set_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
END;
$$;
