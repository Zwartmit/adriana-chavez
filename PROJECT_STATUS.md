# PROJECT_STATUS.md — Adriana Chávez

> Informe de estado del proyecto. Última actualización: 8 de septiembre de 2026.

---

## 1. Stack tecnológico

**Este proyecto usa TanStack Start, NO Next.js.** No hay `pages/` ni `app/` router de Next, no hay `next.config.js`, no hay `getServerSideProps`. Cualquier patrón de Next.js no aplica aquí.

| Capa | Tecnología | Notas |
| --- | --- | --- |
| Framework | **TanStack Start v1** (React 19, SSR + server functions) | No confundir con Next.js |
| Router | **TanStack Router**, file-based en `src/routes/` | `routeTree.gen.ts` se autogenera — nunca editar a mano |
| Build tool | **Vite v8** | Corre en `npm run dev`, elige puerto libre (8080/8081) si el configurado está ocupado |
| Gestor de paquetes | **npm** | `bun` NO está instalado en el entorno de desarrollo actual pese a `bunfig.toml`; usar siempre `npm install` / `npm run` |
| Estilos | **Tailwind CSS v4**, config 100% en `src/styles.css` (bloque `@theme inline`) | **No existe `tailwind.config.js`** |
| Componentes propios | `Button`, `Badge`, `SectionHeader` en `src/components/ui/` | Únicos 3 archivos que quedan en `ui/` |
| Iconos | `lucide-react` | |
| 3D | `@react-three/fiber` + `@react-three/drei` + `three` | Elemento 3D del Hero (`/ac-v2.glb`, ~10 MB) |
| Carrusel | `embla-carousel-react` | Usado en `Testimonios` |
| Data fetching | `@tanstack/react-query` | Instalado, `QueryClient` en contexto |
| Formularios | `react-hook-form` + `zod` (instalados, sin uso real — formularios usan `useState` plano) | |
| Backend | **Supabase** (proyecto real conectado) | Ver §4 |
| Auth | Supabase Auth (`@supabase/supabase-js` + `@supabase/ssr`) | Funcional en `/admin/login` |
| Deploy target | Edge / Cloudflare Workers vía `nitro` (preset `cloudflare-module`) | Configurado, sin desplegar aún |

### Estructura del repositorio

```
/
├── PROJECT_STATUS.md          # este informe
├── README.md
├── package.json / package-lock.json
├── tsconfig.json              # alias @/* -> ./src/*
├── vite.config.ts
├── .env.local                 # credenciales reales — NO se sube a git
├── supabase/
│   ├── schema.sql             # tablas + vista — referencia canónica (usar "profesionales")
│   ├── rls.sql                # políticas RLS
│   └── seed.sql               # datos de ejemplo/prueba
└── src/
    ├── styles.css              # design tokens Noir Couture + Tailwind v4
    ├── routeTree.gen.ts        # AUTOGENERADO — no editar
    ├── routes/                 # una carpeta/archivo por página (file-based routing)
    ├── components/
    │   ├── home/                # 7 secciones del Home (HeroBanner, HeroModel3D, etc.)
    │   ├── layout/               # Navbar, Footer
    │   ├── servicios/            # ServiceCard, ServiciosFiltros, ServiciosGrid
    │   ├── galeria/               # GaleriaFiltros, GaleriaGrid, Lightbox
    │   ├── nosotros/               # EquipoGrid
    │   ├── contacto/                # ContactoForm, MapaContacto
    │   ├── tienda/                   # ProductCard, ProductosGrid, TiendaFiltros, CartDrawer
    │   ├── admin/                    # Todos los componentes del panel de admin
    │   └── ui/                        # Button, Badge, SectionHeader (marca propia)
    ├── constants/index.ts       # NAV_LINKS, SOCIAL_LINKS, CONTACT_INFO, SITE_CONFIG
    └── lib/
        ├── cart/                # CartContext (Context API), types
        ├── supabase/            # client.ts, server.ts, types.ts, auth.ts
        └── utils.ts             # cn, formatPrice, formatDuration
```

---

## 2. Estado de cada página y componente

### Páginas públicas (`src/routes/`) — todas completas y navegables

| Ruta | Archivo | Estado |
| --- | --- | --- |
| `/` | `routes/index.tsx` | ✅ Completa. 7 secciones + modelo 3D en el Hero. |
| `/servicios` | `routes/servicios.tsx` | ✅ Completa. Hero + buscador/filtros + grid dinámico (Supabase). |
| `/galeria` | `routes/galeria.tsx` | ✅ Completa. Hero + filtros + grid masonry + Lightbox. |
| `/sobre-nosotros` | `routes/sobre-nosotros.tsx` | ✅ Completa. Historia + Misión/Visión/Valores + Equipo + 3 Cifras. |
| `/contacto` | `routes/contacto.tsx` | ✅ Completa. Formulario + Mapa + Horarios + FAQ. |
| `/tienda` | `routes/tienda/index.tsx` | ✅ Completa. Grid dinámico + paginación. |
| `/tienda/$slug` | `routes/tienda/$slug.tsx` | ✅ Completa. Detalle de producto con galería, tabs, relacionados. |
| `/admin/login` | `routes/admin/login.tsx` | ✅ Conectada a Supabase Auth real. |
| `/admin` | `routes/admin/index.tsx` | ✅ Guard de sesión → redirige a `/admin/login` si no hay sesión. |

### Panel de Administración (`/admin`) — ✅ FASE B COMPLETADA (sep 2026)

| Sección | Ruta | Estado |
| --- | --- | --- |
| Dashboard | `/admin` | ✅ Tarjetas de KPIs y accesos rápidos |
| Calendario | `/admin/calendario` | ✅ Vista mensual, panel de día, creación y detalle de citas |
| Clientas | `/admin/clientes` | ✅ Listado, búsqueda, nueva clienta, ficha clínica completa |
| Productos | `/admin/productos` | ✅ CRUD completo + carga de imágenes a Supabase Storage |
| Inventario | `/admin/inventario` | ✅ Control de stock físico y virtual |
| Reportes | `/admin/reportes` | ✅ Ingresos por servicios y productos |
| Profesionales | Gestión desde modales | ✅ CRUD de profesionales desde el calendario |

### Flujo de citas (sep 2026)

- **Al crear:** estado inicial `"confirmada"` (automático, sin paso manual).
- **Al pasar el tiempo:** si `fecha_hora + duracion_min < ahora`, la cita se muestra visualmente como `"completada"` en el frontend (sin modificar la BD).
- **Acción manual disponible:** solo **"Cancelar cita"** (con confirmación modal).

---

## 3. Design system — Noir Couture + Sistema Claro/Oscuro

El sitio usa **Noir Couture** (negro profundo + champán dorado + glassmorphism) con fondos alternados claro/oscuro para mejorar el ritmo visual.

Todos los tokens viven en `:root` de `src/styles.css` y se re-exponen a Tailwind vía `@theme inline`. **Regla del proyecto: nunca hardcodear colores — siempre `var(--color-*)`.**

### Paleta actual

```css
/* Fondos — Oscuros */
--color-bg: #0A0A0B;        --color-bg-alt: #111213;
--color-surface: #181818;   --color-surface-alt: #202020;

/* Fondos — Claros */
--color-bg-light: #F5F0E8;
--color-bg-light-alt: #EDE8DF;
--color-surface-light: #FFFFFF;

/* Dorado — color principal de marca */
--color-primary: #E8C97A;   --color-primary-lt: #F0D99A;   --color-primary-dim: #C8A84A;
--color-accent: #E8C97A;    --color-accent-lt: rgba(232,201,122,0.12);

/* Texto — Oscuro (sobre fondo oscuro) */
--color-text-primary: #F5F2EB;
--color-text-secondary: rgba(245,242,235,0.55);
--color-text-muted: rgba(245,242,235,0.30);
--color-text-inverse: #0A0A0B;   /* SOLO para texto sobre fondo dorado */

/* Texto — Claro (sobre fondo claro) */
--color-text-on-light: #0A0A0B;
--color-text-on-light-muted: #5A5550;
--color-text-on-light-faint: #9A9590;

/* Estados */
--color-success: #4CAF80;  --color-warning: #D4A84B;  --color-error: #E05252;
```

> ⚠️ **Regla de contraste crítica:** `--color-text-inverse` (negro) solo es correcto sobre un fondo literalmente `var(--color-primary)` (dorado). Sobre cualquier otro fondo oscuro, usar `--color-text-primary` (marfil). Usar `--color-primary-dim` para dorado sobre fondos claros.

### Glass materials

- **`.glass-obsidian`** — blanco translúcido (4%) + blur 16px. Cards sobre fondo oscuro.
- **`.glass-champagne`** — dorado translúcido (7%) + blur 12px + borde dorado. Paneles destacados.
- **`.glass-frosted`** — negro semitransparente (72%) + blur 20px. Navbar al hacer scroll.

### Tipografía

```css
--font-display: 'Cormorant Garamond', Georgia, serif;  /* títulos, casi siempre italic */
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'DM Mono', monospace;                  /* eyebrows, precios, metadatos */
```

> ⚠️ **Nunca `@import url()` remoto en `styles.css`** — rompe el build. Las fuentes se cargan con `<link>` en `__root.tsx`.

### Trampa técnica ya resuelta

El reset global `* { margin: 0; padding: 0; }` debe estar dentro de `@layer base { ... }`. Si queda fuera, anula silenciosamente todas las utilidades de Tailwind (`px-4`, `gap-4`, etc.) porque las reglas sin capa ganan a cualquier `@layer`.

---

## 4. Backend — Supabase

**Proyecto real conectado**: `uqxzfyubxsudnamleebh.supabase.co`.

### Tablas principales

| Tabla | Descripción |
| --- | --- |
| `perfiles` | Extiende `auth.users`; rol: `admin`, `profesional`, `cliente` |
| `profesionales` | Equipo del centro (antes `estilistas` — renombrada sep 2026) |
| `clientes` | CRM de clientas, incluye ficha clínica |
| `citas` | Agenda de citas; `profesional_id` referencia `profesionales` |
| `servicios` | Catálogo de servicios |
| `productos` | Tienda virtual, imágenes en Supabase Storage (`productos` bucket) |
| `inventario` | Stock físico y virtual |
| `bloqueos_horario` | Bloqueos de agenda |
| `ordenes` / `items_orden` | Pedidos de la tienda |
| `testimonios` | Solo se muestran los aprobados |
| `galeria` | Portafolio |
| `reportes_caja` | Cierre de caja diario |
| `mensajes_contacto` | Formulario público de contacto |

### RLS — resumen de política

- **Público (sin auth):** `servicios`/`productos`/`galeria` activos, `testimonios` aprobados, categorías, `profesionales` activos.
- **Solo staff (`admin`/`profesional`):** `clientes`, `citas`, `bloqueos_horario`, `inventario`.
- **Solo `admin`:** `ordenes`, `reportes_caja`, gestión de servicios/productos/galería/testimonios/profesionales.
- Helpers SQL: `public.es_admin()`, `public.es_staff()`.

---

## 5. Variables de entorno requeridas

Definidas en `.env.local` (raíz del proyecto, **no versionado**):

| Variable | Prefijo `VITE_` | Para qué |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave anónima (segura para el cliente, respeta RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Clave privilegiada — nunca debe compilarse al cliente |
| `VITE_WOMPI_PUBLIC_KEY` | Sí | Pasarela de pagos (Fase C) |
| `VITE_GOOGLE_MAPS_API_KEY` | Sí | Mapa de contacto (Fase C) |
| `VITE_SITE_URL` | Sí | URL base del sitio |

---

## 6. Plan de desarrollo

### ✅ Fase A — Datos reales (COMPLETADA ago 2026)
- ✅ Profesionales, servicios, textos, horarios, usuario admin.
- ✅ Conexión parcial al frontend (servicios, productos).

### ✅ Fase B — Panel de administración (COMPLETADA sep 2026)
- ✅ Calendario de citas con confirmación automática y autocompletado.
- ✅ CRM de clientas.
- ✅ CRUD de productos con carga de imágenes a Supabase Storage.
- ✅ Inventario con control de stock.
- ✅ Reportes de ingresos.

### Fase C — Integraciones (pendiente)
- Formulario de contacto real (hoy simula el envío).
- Google Maps real en `/contacto`.
- Wompi para pagos de la tienda.

### Fase D — Deploy (pendiente)
- Publicar en Vercel o Cloudflare Workers (ya configurado vía `nitro`).
- Dominio propio.
- PWA (manifest, service worker).

### Fase E — Agentes de IA
- Agente de WhatsApp + automatización con n8n.
- Los campos de `citas` (`recordatorio_24h_enviado`, `recordatorio_2h_enviado`, `seguimiento_enviado`, `canal_origen`) y `reportes_caja.generado_por` ya están en el schema pensando en esto.

---

## 7. Decisiones técnicas importantes

1. **TanStack Start, no Next.js.** No introducir `react-router-dom`, `src/pages/`, `App.tsx`.
2. **Tailwind v4 sin archivo de config.** Todo vive en `@theme inline` dentro de `src/styles.css`.
3. **Backend: Supabase, no Lovable Cloud.** Proyecto real ya creado y conectado.
4. **Estilado principal vía `style={{}}` inline con `var(--token)`**, no clases utilitarias de Tailwind para color/tipografía.
5. **Se eliminaron ~37 componentes shadcn/ui sin usar** — solo se conservan `Button`, `Badge`, `SectionHeader`.
6. **Tabla renombrada de `estilistas` a `profesionales`** (sep 2026) — afecta todos los archivos del proyecto.
7. **El carrito no persiste** (no hay `localStorage`) — es estado de sesión vía Context API.
8. **`npm`, no `bun`**, pese a que existe `bunfig.toml` en el repo.
9. **Flujo de citas simplificado (sep 2026):** confirmación automática al crear; completado visual basado en tiempo; solo botón "Cancelar cita" en el modal de detalle.
10. **`SUPABASE_SERVICE_ROLE_KEY` sin prefijo `VITE_`** — para que Vite nunca la incluya en el bundle del cliente.

---

## 8. Cómo retomar el proyecto en una nueva sesión

1. **Leer este archivo completo primero.**
2. Confirmar que `.env.local` existe en la raíz con las credenciales reales.
3. Instalar dependencias: `npm install`.
4. Levantar el dev server: `npm run dev` (revisar el log de arranque para confirmar el puerto, normalmente 8080).
5. Si vas a tocar `src/styles.css`: leer primero la nota de `@layer` en §3 antes de mover/quitar el reset global.
6. Si vas a tocar colores: nunca texto claro sobre claro ni oscuro sobre oscuro; usar `--color-primary-dim` para dorado en fondos claros.
7. Antes de dar por "conectado a Supabase" cualquier feature nueva, verificar con una llamada REST real — el schema puede estar desincronizado.
8. Antes de agregar una tabla o columna nueva a Supabase, actualizar `supabase/schema.sql` **y** `src/lib/supabase/types.ts` a mano (no hay generación automática de tipos configurada).
