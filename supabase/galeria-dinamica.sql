-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS public.categorias_galeria (
  id      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE,
  slug    TEXT NOT NULL UNIQUE,
  orden   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insertar valores por defecto (los mismos que estaban hardcodeados)
INSERT INTO public.categorias_galeria (nombre, slug, orden) VALUES
  ('Antes & Después', 'antes-despues', 1),
  ('Coloración', 'coloracion', 2),
  ('Corte', 'corte', 3),
  ('Tratamiento', 'tratamiento', 4),
  ('Uñas', 'unas', 5),
  ('Peinado', 'peinado', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. Modificar tabla galeria para usar ID
ALTER TABLE public.galeria ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_galeria(id);

-- Migrar datos si existían (asume que galeria.categoria era el slug)
UPDATE public.galeria SET categoria_id = (SELECT id FROM public.categorias_galeria WHERE slug = galeria.categoria)
WHERE categoria_id IS NULL;

-- 4. RLS para categorias_galeria
ALTER TABLE public.categorias_galeria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica categorias galeria" ON public.categorias_galeria;
DROP POLICY IF EXISTS "Admin categorias galeria" ON public.categorias_galeria;

CREATE POLICY "Lectura publica categorias galeria"
  ON public.categorias_galeria FOR SELECT
  USING (true);

CREATE POLICY "Admin categorias galeria"
  ON public.categorias_galeria FOR ALL
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- 5. RLS para galeria
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica galeria" ON public.galeria;
DROP POLICY IF EXISTS "Admin galeria" ON public.galeria;

CREATE POLICY "Lectura publica galeria"
  ON public.galeria FOR SELECT
  USING (true);

CREATE POLICY "Admin galeria"
  ON public.galeria FOR ALL
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- 6. Crear Bucket público en Storage para las imágenes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('galeria', 'galeria', true)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS para el Bucket de Storage
DROP POLICY IF EXISTS "Public galeria Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin galeria Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin galeria Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin galeria Delete" ON storage.objects;

CREATE POLICY "Public galeria Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'galeria' );

CREATE POLICY "Admin galeria Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'galeria' AND 
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );
  
CREATE POLICY "Admin galeria Update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'galeria' AND 
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin galeria Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'galeria' AND 
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );
