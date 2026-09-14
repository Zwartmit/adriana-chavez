
-- 1. Eliminar datos de prueba actuales
DELETE FROM public.productos;
-- (Si hay eliminación en cascada, el inventario se borrará automáticamente. 
-- Si no, descomenta la siguiente línea):
-- DELETE FROM public.inventario;

-- 2. Insertar inventario real

WITH new_prod_0 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX champú N 4', 'Olaplex', 0, true, false, false, 'olaplex-champ-n-4-7448', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_0
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_1 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX acondicionador N 5', 'Olaplex', 0, true, false, false, 'olaplex-acondicionador-n-5-5856', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_1
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_2 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX leave N 6', 'Olaplex', 0, true, false, false, 'olaplex-leave-n-6-2507', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 8, 0 FROM new_prod_2
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_3 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX oil N 7', 'Olaplex', 0, true, false, false, 'olaplex-oil-n-7-410', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 9, 0 FROM new_prod_3
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_4 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX moisture mask N 8', 'Olaplex', 0, true, false, false, 'olaplex-moisture-mask-n-8-6444', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_4
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_5 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX protecteur N 9', 'Olaplex', 0, true, false, false, 'olaplex-protecteur-n-9-3859', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_5
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_6 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX repair 100ml  N 3', 'Olaplex', 0, true, false, false, 'olaplex-repair-100ml-n-3-7191', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_6
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_7 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX repair 250ml N3', 'Olaplex', 0, true, false, false, 'olaplex-repair-250ml-n3-1002', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_7
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_8 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX champooi clarifiant N4C', 'Olaplex', 0, true, false, false, 'olaplex-champooi-clarifiant-n4c-9869', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_8
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_9 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX champoo tonificante N 4p', 'Olaplex', 0, true, false, false, 'olaplex-champoo-tonificante-n-4p-7099', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_9
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_10 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OLAPLEX 4-IN -1', 'Olaplex', 0, true, false, false, 'olaplex-4-in-1-4764', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_10
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_12 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR  SHAMPOO 250ml', 'Wella', 135, true, false, false, 'ult-mate-repair-shampoo-250ml-91', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_12
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_13 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR CONDITIONER 200ml', 'Wella', 155, true, false, false, 'ult-mate-repair-conditioner-200ml-3709', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_13
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_14 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR MASK150ml', 'Wella', 165, true, false, false, 'ult-mate-repair-mask150ml-3235', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_14
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_15 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR 90 seconds 30ml', 'Wella', 70, true, false, false, 'ult-mate-repair-90-seconds-30ml-4699', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_15
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_16 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR 90 seconds 95ml', 'Wella', 185, true, false, false, 'ult-mate-repair-90-seconds-95ml-7336', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_16
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_17 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR nocturno 95ml', 'Wella', 0, true, false, false, 'ult-mate-repair-nocturno-95ml-3737', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_17
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_18 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR nocturno 30ml', 'Wella', 0, true, false, false, 'ult-mate-repair-nocturno-30ml-2445', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_18
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_19 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR SHAMPOO 1L', 'Wella', 0, true, false, false, 'ult-mate-repair-shampoo-1l-186', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_19
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_20 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR ACONDICIONADOR 500ml', 'Wella', 0, true, false, false, 'ult-mate-repair-acondicionador-500ml-6024', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_20
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_21 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE REPAIR MASK 500ml', 'Wella', 0, true, false, false, 'ult-mate-repair-mask-500ml-9786', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_21
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_23 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('CHAMPOO FUSIÓN 250ml', 'Wella', 0, true, false, false, 'champoo-fusi-n-250ml-1953', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_23
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_24 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ACONDICIONADOR FUSIÓN 200ml', 'Wella', 0, true, false, false, 'acondicionador-fusi-n-200ml-6038', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_24
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_25 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('MASK FUSIÓN 150ml', 'Wella', 0, true, false, false, 'mask-fusi-n-150ml-8163', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_25
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_26 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('FUSIÓN CHAMPOO 1L', 'Wella', 0, true, false, false, 'fusi-n-champoo-1l-9964', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_26
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_27 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('FUSIÓN ACONDICIONADOR 1L', 'Wella', 0, true, false, false, 'fusi-n-acondicionador-1l-7099', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_27
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_28 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('FUSIÓN MASK 500ml', 'Wella', 0, true, false, false, 'fusi-n-mask-500ml-4027', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_28
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_30 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE SMOOTH CHAMPOO 250ML', 'Wella', 0, true, false, false, 'ult-mate-smooth-champoo-250ml-5099', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 4, 0 FROM new_prod_30
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_31 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE SMOOTH ACONDICIONADOR20ML', 'Wella', 0, true, false, false, 'ult-mate-smooth-acondicionador20ml-21', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 4, 0 FROM new_prod_31
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_32 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE SMOOTH MASK 150ML', 'Wella', 0, true, false, false, 'ult-mate-smooth-mask-150ml-2123', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_32
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_34 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE SMOOTH MIRACLE OIL SERUM 100ML', 'Wella', 0, true, false, false, 'ult-mate-smooth-miracle-oil-serum-100ml-8224', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_34
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_36 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INVIGO COLOR BRILLANCE CHAMPOO 250ml', 'Wella', 0, true, false, false, 'invigo-color-brillance-champoo-250ml-3271', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_36
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_37 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INVIGO COLOR BRILLANCE ACONDICIONADOR 200ML', 'Wella', 0, true, false, false, 'invigo-color-brillance-acondicionador-200ml-644', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_37
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_38 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INVIGO COLOR BRILLANCE MASK 150ML', 'Wella', 0, true, false, false, 'invigo-color-brillance-mask-150ml-7557', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_38
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_39 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INVIGO COLOR BRILLANCE SPRAY 150ML', 'Wella', 0, true, false, false, 'invigo-color-brillance-spray-150ml-4942', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_39
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_41 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OIL REFLECTIONS CHAMPOO 250ML', 'Wella', 0, true, false, false, 'oil-reflections-champoo-250ml-5014', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_41
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_42 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OIL REFLECTIONS ACONDICIONADOR 200ml', 'Wella', 0, true, false, false, 'oil-reflections-acondicionador-200ml-513', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_42
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_43 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('OIL REFLECTIONS MASK150ml', 'Wella', 0, true, false, false, 'oil-reflections-mask150ml-9740', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_43
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_45 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('WELLAINVIGO NUTRIENRICH CHAMPOO 250ml', 'Wella', 0, true, false, false, 'wellainvigo-nutrienrich-champoo-250ml-1012', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_45
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_46 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('WELLAINVIGO NUTRIENRICH ACONDICIONADOR 200ml', 'Wella', 0, true, false, false, 'wellainvigo-nutrienrich-acondicionador-200ml-1013', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_46
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_47 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('WELLAINVIGO NUTRIENRICH SPRAY 150ml', 'Wella', 0, true, false, false, 'wellainvigo-nutrienrich-spray-150ml-6227', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_47
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_49 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('DARK OIL CHAMPOO 250ml', 'Sebastian', 0, true, false, false, 'dark-oil-champoo-250ml-9177', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_49
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_50 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('DARK OIL ACONDICIONADOR 250ml', 'Sebastian', 0, true, false, false, 'dark-oil-acondicionador-250ml-1524', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_50
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_51 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('DARK OIL MASK 150ml', 'Sebastian', 0, true, false, false, 'dark-oil-mask-150ml-3393', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_51
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_52 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('DARK OIL OIL 30ml', 'Sebastian', 0, true, false, false, 'dark-oil-oil-30ml-7823', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_52
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_53 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('DARK OIL OIL 95ml', 'Sebastian', 0, true, false, false, 'dark-oil-oil-95ml-508', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_53
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_55 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INVIGO SUN PROTECTION SPRAY 150ml', 'Wella', 0, true, false, false, 'invigo-sun-protection-spray-150ml-7445', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_55
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_57 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('LUXEOIL CHAMPOO 200ml', 'Wella', 0, true, false, false, 'luxeoil-champoo-200ml-4248', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_57
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_58 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('LUXEOIL OIL 100ml', 'Wella', 0, true, false, false, 'luxeoil-oil-100ml-5444', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_58
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_61 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INVIGO BLONDE RECHARGE COOL violeta ACONDICIONADOR 200ml', 'Wella', 0, true, false, false, 'invigo-blonde-recharge-cool-violeta-acondicionador-200ml-8423', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_61
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_63 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('TERMIPROTECTOR all in One leave in conditioner 160ml', 'Moroccanoil', 0, true, false, false, 'termiprotector-all-in-one-leave-in-conditioner-160ml-6717', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_63
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_64 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Oil LIGHT 100ml', 'Moroccanoil', 0, true, false, false, 'oil-light-100ml-3544', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_64
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_65 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('INTENSE CURL CREAM 300ml', 'Moroccanoil', 0, true, false, false, 'intense-curl-cream-300ml-6527', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_65
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_66 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('PROTECTOR 225 ML', 'Moroccanoil', 0, true, false, false, 'protector-225-ml-6207', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_66
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_68 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('CHAMPOO 1L', 'Nioxin', 0, true, false, false, 'champoo-1l-1807', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_68
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_69 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Kit 150 ml Naranja', 'Nioxin', 0, true, false, false, 'kit-150-ml-naranja-8801', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_69
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_70 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Kit 300ml Naranja', 'Nioxin', 0, true, false, false, 'kit-300ml-naranja-7459', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_70
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_71 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ULTÍMATE POWER SERUN para la caída 70ml', 'Nioxin', 0, true, false, false, 'ult-mate-power-serun-para-la-ca-da-70ml-7548', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_71
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_72 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('DENSITY DEFEND engrosados para cabello fino 100ml', 'Nioxin', 0, true, false, false, 'density-defend-engrosados-para-cabello-fino-100ml-2577', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_72
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_75 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Hidratación CHAMPOO 300ml', 'Authentic', 0, true, false, false, 'authentic-hidrataci-n-champoo-300ml-9219', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_75
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_76 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Hidratación ACONDICIONADOR 250ml', 'Authentic', 0, true, false, false, 'authentic-hidrataci-n-acondicionador-250ml-2138', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 4, 0 FROM new_prod_76
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_77 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Hidratación SPRAY TERMO 250ml', 'Authentic', 0, true, false, false, 'authentic-hidrataci-n-spray-termo-250ml-8830', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_77
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_78 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Hidratación MASK 200ml', 'Authentic', 0, true, false, false, 'authentic-hidrataci-n-mask-200ml-4296', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_78
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_80 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Reparación CHAMPOO 300ml', 'Authentic', 0, true, false, false, 'authentic-reparaci-n-champoo-300ml-5626', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_80
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_81 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Reparación ACONDICIONADOR 250ml', 'Authentic', 0, true, false, false, 'authentic-reparaci-n-acondicionador-250ml-232', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 5, 0 FROM new_prod_81
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_82 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Reparación SPRAY 250ml', 'Authentic', 0, true, false, false, 'authentic-reparaci-n-spray-250ml-6274', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_82
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_83 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Reparación MASK 250ml', 'Authentic', 0, true, false, false, 'authentic-reparaci-n-mask-250ml-5172', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 6, 0 FROM new_prod_83
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_85 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección CHAMPOO 300ml', 'Authentic', 0, true, false, false, 'authentic-protecci-n-champoo-300ml-5564', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_85
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_86 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección ACONDICIONADOR 250ml', 'Authentic', 0, true, false, false, 'authentic-protecci-n-acondicionador-250ml-6435', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_86
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_87 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección SPRAY 200ml', 'Authentic', 0, true, false, false, 'authentic-protecci-n-spray-200ml-4360', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_87
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_88 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección MASK 200ml', 'Authentic', 0, true, false, false, 'authentic-protecci-n-mask-200ml-3903', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_88
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_89 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección HAND Y HAIR LIGHT crema para manos 75ml', 'Authentic', 0, true, false, false, 'authentic-protecci-n-hand-y-hair-light-crema-para-manos-75ml-1119', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_89
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_90 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección EAU DE TOILETTE 50ml losion', 'Authentic', 0, true, false, false, 'authentic-protecci-n-eau-de-toilette-50ml-losion-9880', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 4, 0 FROM new_prod_90
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_91 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección INDUL GING FLUID OIL 100ml', 'Authentic', 0, true, false, false, 'authentic-protecci-n-indul-ging-fluid-oil-100ml-8638', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_91
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_92 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('Authentic Protección SENSORIAL CREAM SCRUB 250 ml exfoliante', 'Authentic', 0, true, false, false, 'authentic-protecci-n-sensorial-cream-scrub-250-ml-exfoliante-3124', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 2, 0 FROM new_prod_92
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_94 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('CHAMPOO 250ml', 'Cadiveu', 0, true, false, false, 'champoo-250ml-2585', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 1, 0 FROM new_prod_94
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_95 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('ACONDICIONADOR 250ml', 'Cadiveu', 0, true, false, false, 'acondicionador-250ml-3975', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 3, 0 FROM new_prod_95
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;

WITH new_prod_96 AS (
  INSERT INTO public.productos (nombre, marca, precio, activo, es_nuevo, destacado, slug, categoria_id) 
  VALUES ('PROTEIN 200ml', 'Cadiveu', 0, true, false, false, 'protein-200ml-8248', (SELECT id FROM public.categorias_productos WHERE slug = 'cuidado-capilar' LIMIT 1))
  RETURNING id
)
INSERT INTO public.inventario (producto_id, stock_fisico, stock_virtual)
SELECT id, 4, 0 FROM new_prod_96
ON CONFLICT (producto_id) DO UPDATE 
SET stock_fisico = EXCLUDED.stock_fisico;
