-- ══════════════════════════════════════════════════════════════════
-- ADRIANA CHÁVEZ — SALÓN DE BELLEZA
-- Data de prueba (seed) — Fase A1
-- Ejecutar en: Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- ESTILISTAS (4 — mismos del Brief #5 / EquipoGrid.tsx)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.estilistas (nombre, cargo, especialidades, bio, foto_url, anos_experiencia, activo, orden) VALUES
  ('Adriana Chávez', 'Fundadora & Directora Creativa',
    ARRAY['Coloración', 'Balayage', 'Dirección artística'],
    'Fundadora del salón con más de 14 años de experiencia. Formada en Colombia, México y España.',
    'https://placehold.co/120x120/1A1820/D4AF6B?text=AC', 14, TRUE, 1),

  ('Valentina Mora', 'Estilista Senior',
    ARRAY['Corte', 'Peinado', 'Tratamientos'],
    'Especialista en cortes de precisión y peinados para eventos. Certificada por L''Oréal Professionnel.',
    'https://placehold.co/120x120/1A1820/D4AF6B?text=VM', 8, TRUE, 2),

  ('Camila Restrepo', 'Colorista',
    ARRAY['Highlights', 'Mechas', 'Color fantasy'],
    'Colorista especializada en técnicas de iluminación y color contemporáneo.',
    'https://placehold.co/120x120/D4AF6B/0C0B0F?text=CR', 6, TRUE, 3),

  ('Laura Jiménez', 'Especialista en Uñas',
    ARRAY['Manicure', 'Nail art', 'Acrílico'],
    'Especialista en nail art y técnicas de uñas con formación en Brasil y Colombia.',
    'https://placehold.co/120x120/1A1820/D4AF6B?text=LJ', 5, TRUE, 4);

-- ──────────────────────────────────────────────────────────────────
-- SERVICIOS (12 — mismos del array SERVICIOS en ServiciosGrid.tsx)
-- categoria_id se resuelve por slug contra categorias_servicios
-- (sembrada por schema.sql: cabello, color, tratamiento, unas, peinado)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.servicios (categoria_id, nombre, slug, descripcion, duracion_min, precio, imagen_url, activo, orden) VALUES
  ((SELECT id FROM public.categorias_servicios WHERE slug = 'cabello'),
    'Corte & Estilo', 'corte-estilo',
    'Corte personalizado según tu tipo de rostro y estilo de vida, con blow dry incluido.',
    60, 85000, 'https://placehold.co/600x400/131118/D4AF6B?text=Corte+%26+Estilo', TRUE, 1),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'cabello'),
    'Corte + Tratamiento', 'corte-tratamiento',
    'Corte personalizado más tratamiento nutritivo para cabello sano y brillante.',
    90, 150000, 'https://placehold.co/600x400/1A1820/D4AF6B?text=Corte+Tratamiento', TRUE, 2),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'cabello'),
    'Blowout Premium', 'blowout-premium',
    'Lavado, hidratación y blow dry profesional para un acabado perfecto y duradero.',
    45, 65000, 'https://placehold.co/600x400/131118/D4AF6B?text=Blowout', TRUE, 3),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'color'),
    'Coloración Completa', 'coloracion-completa',
    'Coloración de raíz a puntas con productos premium. Incluye tratamiento post-color.',
    150, 220000, 'https://placehold.co/600x400/1A1820/D4AF6B?text=Coloraci%C3%B3n', TRUE, 4),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'color'),
    'Balayage', 'balayage',
    'Técnica de iluminación a mano alzada para un efecto natural y progresivo.',
    180, 320000, 'https://placehold.co/600x400/131118/D4AF6B?text=Balayage', TRUE, 5),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'color'),
    'Highlights & Mechas', 'highlights-mechas',
    'Mechones de color estratégicamente ubicados para dar luminosidad y volumen visual.',
    120, 280000, 'https://placehold.co/600x400/1A1820/D4AF6B?text=Highlights', TRUE, 6),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'tratamiento'),
    'Tratamiento Capilar', 'tratamiento-capilar',
    'Nutrición profunda y restauración para cabello dañado, seco o debilitado.',
    60, 120000, 'https://placehold.co/600x400/131118/D4AF6B?text=Tratamiento', TRUE, 7),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'tratamiento'),
    'Botox Capilar', 'botox-capilar',
    'Tratamiento de relleno y nutrición extrema. Devuelve elasticidad y brillo al cabello.',
    90, 180000, 'https://placehold.co/600x400/1A1820/D4AF6B?text=Bot%C3%B3x+Capilar', TRUE, 8),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'tratamiento'),
    'Alisado Brasileño', 'alisado-brasileno',
    'Reduce el frizz y define la forma del cabello con efecto duradero de hasta 6 meses.',
    180, 380000, 'https://placehold.co/600x400/131118/D4AF6B?text=Alisado', TRUE, 9),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'unas'),
    'Manicure Semipermanente', 'manicure-semipermanente',
    'Esmaltado semipermanente de larga duración con acabado perfecto.',
    60, 70000, 'https://placehold.co/600x400/1A1820/D4AF6B?text=Manicure', TRUE, 10),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'unas'),
    'Pedicure Spa', 'pedicure-spa',
    'Tratamiento completo de pies con exfoliación, hidratación y esmaltado.',
    75, 85000, 'https://placehold.co/600x400/131118/D4AF6B?text=Pedicure+Spa', TRUE, 11),

  ((SELECT id FROM public.categorias_servicios WHERE slug = 'peinado'),
    'Peinado para Eventos', 'peinado-eventos',
    'Peinado profesional para bodas, grados, fiestas y cualquier ocasión especial.',
    90, 150000, 'https://placehold.co/600x400/1A1820/D4AF6B?text=Peinado+Evento', TRUE, 12);

-- ──────────────────────────────────────────────────────────────────
-- PRODUCTOS (16 — mismos del array PRODUCTOS en ProductosGrid.tsx)
-- categoria_id se resuelve por slug contra categorias_productos
-- (sembrada por schema.sql: cuidado-capilar, coloracion, tratamientos,
--  estilizado, unas, accesorios)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.productos (categoria_id, nombre, slug, marca, descripcion, precio, imagenes, rating, total_resenas, es_nuevo, activo, orden) VALUES
  ((SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar'),
    'Shampoo Hidratación Profunda', 'shampoo-hidratacion-profunda', 'L''Oréal Professionnel',
    'Shampoo nutritivo para cabello seco y dañado. Fórmula con aceite de argán.',
    85000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Shampoo'], 4.8, 24, TRUE, TRUE, 1),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar'),
    'Acondicionador Reparador', 'acondicionador-reparador', 'Kérastase',
    'Acondicionador de alta concentración para cabello muy dañado o quebradizo.',
    125000, ARRAY['https://placehold.co/400x400/181818/E8C97A?text=Acondicionador'], 4.9, 18, FALSE, TRUE, 2),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar'),
    'Mascarilla Nutrición Extrema', 'mascarilla-nutricion-extrema', 'Wella Professionals',
    'Mascarilla semanal de nutrición profunda. Restaura la fibra capilar desde adentro.',
    98000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Mascarilla'], 4.7, 31, FALSE, TRUE, 3),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar'),
    'Sérum Brillo Intenso', 'serum-brillo-intenso', 'Redken',
    'Sérum ligero para dar brillo y suavidad sin pesar el cabello.',
    72000, ARRAY['https://placehold.co/400x400/E8C97A/0A0A0B?text=S%C3%A9rum'], 4.6, 15, FALSE, TRUE, 4),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'coloracion'),
    'Tinte Permanente Castaño Natural', 'tinte-permanente-castaño', 'Schwarzkopf',
    'Coloración permanente profesional. Cobertura total de canas con brillo intenso.',
    45000, ARRAY['https://placehold.co/400x400/181818/E8C97A?text=Tinte'], 4.5, 42, FALSE, TRUE, 5),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'coloracion'),
    'Tratamiento Post-Color', 'tratamiento-post-color', 'L''Oréal Professionnel',
    'Tratamiento sellador para preservar el color y añadir brillo después de la coloración.',
    68000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Post-Color'], 4.8, 19, TRUE, TRUE, 6),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'tratamientos'),
    'Ampolla Keratina Pura', 'ampolla-keratina-pura', 'Inoar',
    'Ampolla de keratina pura para uso en casa. Sella la cutícula y elimina el frizz.',
    35000, ARRAY['https://placehold.co/400x400/181818/E8C97A?text=Amp%C3%B3lla'], 4.7, 56, FALSE, TRUE, 7),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'tratamientos'),
    'Aceite de Argán Premium', 'aceite-argán-premium', 'Moroccanoil',
    'Aceite multiusos de argán marroquí. Nutrición, brillo y protección térmica.',
    145000, ARRAY['https://placehold.co/400x400/E8C97A/0A0A0B?text=Aceite+Arg%C3%A1n'], 4.9, 67, FALSE, TRUE, 8),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'tratamientos'),
    'Crema para Peinar Rizos', 'crema-peinar-rizos', 'DevaCurl',
    'Crema definidora de rizos sin sulfatos. Define, hidrata y controla el volumen.',
    89000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Crema+Rizos'], 4.6, 28, FALSE, TRUE, 9),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'estilizado'),
    'Spray Protector Térmico', 'spray-protector-termico', 'Tresemmé Pro',
    'Protector térmico hasta 230°C. Ideal para uso con plancha y secador profesional.',
    42000, ARRAY['https://placehold.co/400x400/181818/E8C97A?text=Protector+T%C3%A9rmico'], 4.5, 33, FALSE, TRUE, 10),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'estilizado'),
    'Laca Fijación Fuerte', 'laca-fijacion-fuerte', 'Schwarzkopf',
    'Laca de fijación extrafuerte para peinados duraderos. Sin efecto cartón.',
    38000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Laca'], 4.4, 21, FALSE, TRUE, 11),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'estilizado'),
    'Cera Modeladora Mate', 'cera-modeladora-mate', 'American Crew',
    'Cera de acabado mate para dar textura y definición con sujeción flexible.',
    55000, ARRAY['https://placehold.co/400x400/181818/E8C97A?text=Cera'], 4.7, 14, FALSE, TRUE, 12),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'unas'),
    'Esmalte Semipermanente Nude', 'esmalte-semipermanente-nude', 'OPI',
    'Esmalte gel de larga duración. Tono nude natural. Hasta 3 semanas sin descascararse.',
    32000, ARRAY['https://placehold.co/400x400/E8C97A/0A0A0B?text=Esmalte+Nude'], 4.8, 45, FALSE, TRUE, 13),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'unas'),
    'Base Coat Fortalecedora', 'base-coat-uñas', 'Sally Hansen',
    'Base endurecedora de uñas con calcio y vitaminas. Previene el quiebre.',
    28000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Base+Coat'], 4.6, 38, FALSE, TRUE, 14),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'accesorios'),
    'Cepillo Paleta Profesional', 'cepillo-paleta-profesional', 'Termix',
    'Cepillo de paleta neumática con cerdas de jabalí y nylon. Desenlaza sin romper.',
    78000, ARRAY['https://placehold.co/400x400/181818/E8C97A?text=Cepillo'], 4.9, 22, TRUE, TRUE, 15),

  ((SELECT id FROM public.categorias_productos WHERE slug = 'accesorios'),
    'Toalla de Microfibra para Cabello', 'toalla-microfibra-cabello', 'Aquis',
    'Toalla ultrafina de microfibra que reduce el frizz y el tiempo de secado en un 50%.',
    48000, ARRAY['https://placehold.co/400x400/131118/E8C97A?text=Toalla'], 4.7, 29, FALSE, TRUE, 16);

-- ──────────────────────────────────────────────────────────────────
-- INVENTARIO (1 registro por producto — stock_virtual 5–30, umbral_alerta 5)
-- Se resuelve por slug contra la tabla productos insertada arriba
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.inventario (producto_id, stock_virtual, stock_fisico, umbral_alerta)
SELECT id, stock, stock, 5
FROM public.productos
JOIN (VALUES
  ('shampoo-hidratacion-profunda', 22),
  ('acondicionador-reparador', 14),
  ('mascarilla-nutricion-extrema', 27),
  ('serum-brillo-intenso', 9),
  ('tinte-permanente-castaño', 30),
  ('tratamiento-post-color', 17),
  ('ampolla-keratina-pura', 25),
  ('aceite-argán-premium', 11),
  ('crema-peinar-rizos', 19),
  ('spray-protector-termico', 6),
  ('laca-fijacion-fuerte', 28),
  ('cera-modeladora-mate', 8),
  ('esmalte-semipermanente-nude', 20),
  ('base-coat-uñas', 15),
  ('cepillo-paleta-profesional', 12),
  ('toalla-microfibra-cabello', 24)
) AS seed_stock(slug, stock) ON seed_stock.slug = productos.slug;

-- ──────────────────────────────────────────────────────────────────
-- GALERÍA (18 — mismos de GALERIA_ITEMS en GaleriaGrid.tsx)
-- categoria mapeada al enum de la tabla: antes-despues, coloracion,
-- corte, tratamiento, unas, peinado
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.galeria (titulo, categoria, tag, imagen_url, activo, orden) VALUES
  ('Transformación completa', 'antes-despues', 'Transformación completa', 'https://placehold.co/400x600/131118/E8C97A?text=Antes+%26+Despu%C3%A9s+1', TRUE, 1),
  ('Cambio de look', 'antes-despues', 'Cambio de look', 'https://placehold.co/400x600/181818/E8C97A?text=Antes+%26+Despu%C3%A9s+2', TRUE, 2),
  ('Renovación total', 'antes-despues', 'Renovación total', 'https://placehold.co/400x600/131118/E8C97A?text=Antes+%26+Despu%C3%A9s+3', TRUE, 3),

  ('Balayage', 'coloracion', 'Balayage', 'https://placehold.co/600x400/181818/E8C97A?text=Balayage', TRUE, 4),
  ('Highlights', 'coloracion', 'Highlights', 'https://placehold.co/500x500/131118/E8C97A?text=Highlights', TRUE, 5),
  ('Color completo', 'coloracion', 'Color completo', 'https://placehold.co/600x400/E8C97A/0A0A0B?text=Color+completo', TRUE, 6),
  ('Mechas californianas', 'coloracion', 'Mechas californianas', 'https://placehold.co/400x600/181818/E8C97A?text=Mechas', TRUE, 7),

  ('Bob moderno', 'corte', 'Bob moderno', 'https://placehold.co/500x500/131118/E8C97A?text=Corte+bob', TRUE, 8),
  ('Capas largas', 'corte', 'Capas largas', 'https://placehold.co/600x400/181818/E8C97A?text=Corte+largo', TRUE, 9),
  ('Pixie cut', 'corte', 'Pixie cut', 'https://placehold.co/400x600/E8C97A/0A0A0B?text=Corte+pixie', TRUE, 10),

  ('Alisado brasileño', 'tratamiento', 'Alisado brasileño', 'https://placehold.co/600x400/131118/E8C97A?text=Alisado', TRUE, 11),
  ('Botox capilar', 'tratamiento', 'Botox capilar', 'https://placehold.co/500x500/181818/E8C97A?text=Bot%C3%B3x+capilar', TRUE, 12),
  ('Nutrición profunda', 'tratamiento', 'Nutrición profunda', 'https://placehold.co/400x600/131118/E8C97A?text=Tratamiento', TRUE, 13),

  ('Semipermanente', 'unas', 'Semipermanente', 'https://placehold.co/500x500/E8C97A/0A0A0B?text=Manicure', TRUE, 14),
  ('Nail art', 'unas', 'Nail art', 'https://placehold.co/600x400/181818/E8C97A?text=Nail+art', TRUE, 15),

  ('Novia', 'peinado', 'Novia', 'https://placehold.co/400x600/131118/E8C97A?text=Peinado+novia', TRUE, 16),
  ('Recogido elegante', 'peinado', 'Recogido elegante', 'https://placehold.co/600x400/181818/E8C97A?text=Recogido', TRUE, 17),
  ('Ondas naturales', 'peinado', 'Ondas naturales', 'https://placehold.co/500x500/E8C97A/0A0A0B?text=Ondas', TRUE, 18);

-- ──────────────────────────────────────────────────────────────────
-- TESTIMONIOS (5 — mismos de TESTIMONIOS en Testimonios.tsx)
-- cliente_id se deja NULL: son testimonios de ejemplo, no ligados
-- a un registro real de la tabla clientes
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.testimonios (nombre, servicio, texto, rating, desde_anio, aprobado, orden) VALUES
  ('María García', 'Coloración Premium',
    'El mejor salón en el que he estado. El resultado superó todas mis expectativas. Adriana y su equipo son increíbles.',
    5, 2021, TRUE, 1),

  ('Laura Rodríguez', 'Corte & Estilo',
    'Llevo 4 años yendo y nunca me han decepcionado. El ambiente es precioso y el trato es excepcional.',
    5, 2020, TRUE, 2),

  ('Daniela Torres', 'Tratamiento Capilar',
    'Mi cabello estaba muy dañado y después del tratamiento quedó como nuevo. 100% recomendado.',
    5, 2022, TRUE, 3),

  ('Valentina López', 'Manicure & Pedicure',
    'El servicio de uñas es impecable. Duran semanas perfectas y los diseños son exactamente lo que pido.',
    5, 2019, TRUE, 4),

  ('Camila Martínez', 'Coloración Premium',
    'Primera vez que venía y ya soy clienta fija. El equipo es profesional, cálido y muy detallista.',
    5, 2023, TRUE, 5);

-- ══════════════════════════════════════════════════════════════════
-- INSTRUCCIONES
-- ══════════════════════════════════════════════════════════════════
--
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema.sql y rls.sql
--
-- Para limpiar y reinsertar: DELETE FROM tabla CASCADE antes de cada
-- bloque. Este script asume las tablas vacías (inserta sin ON CONFLICT);
-- si se vuelve a correr sobre datos ya sembrados, fallará por los
-- UNIQUE de slug/nombre. Orden recomendado de limpieza (respeta FKs,
-- de hijas a padres):
--
--   DELETE FROM public.inventario CASCADE;
--   DELETE FROM public.testimonios CASCADE;
--   DELETE FROM public.galeria CASCADE;
--   DELETE FROM public.productos CASCADE;
--   DELETE FROM public.servicios CASCADE;
--   DELETE FROM public.estilistas CASCADE;
--
-- Este seed se ejecutó con la service role key (bypass de RLS) desde
-- Claude Code el 18 de agosto de 2026 — ver PROJECT_STATUS.md §4 para
-- el conteo de filas resultante por tabla.
