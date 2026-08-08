# PROJECT_STATUS.md — Adriana Chávez

> Informe de estado del proyecto. Última actualización: 8 de agosto de 2026.

---

## 1. Resumen del proyecto

**Nombre:** Adriana Chávez
**Descripción:** Sitio web para un salón de belleza premium ubicado en Bogotá D.C., Colombia.
**Propósito:** Presentar la marca, sus servicios y su portafolio, y convertir visitas en reservas de cita (vía formulario de contacto y WhatsApp). A futuro incluye una tienda de productos.

### Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR + server functions) |
| Router | TanStack Router (file-based routing, `src/routes/`) |
| Build tool | Vite 7/8 con `@lovable.dev/vite-tanstack-config` |
| Estilos | Tailwind CSS v4 (config vía `src/styles.css`, sin `tailwind.config.js`) |
| Componentes | shadcn/ui (New York, base slate) + componentes propios de marca |
| Iconos | lucide-react |
| Data fetching | @tanstack/react-query (instalado, aún sin uso real) |
| Carrusel | embla-carousel-react |
| Formularios | react-hook-form + zod + @hookform/resolvers (instalados, sin uso aún) |
| Toasts | sonner (instalado, `<Toaster />` NO montado aún) |
| Deploy target | Edge / Cloudflare Workers (vía nitro) |
| Backend | **No conectado.** Lovable Cloud no está habilitado. |

### Estructura general del repositorio

```
/
├── PROJECT_STATUS.md          # este informe
├── AGENTS.md                  # notas de trabajo del agente
├── components.json            # config shadcn/ui
├── package.json
├── bunfig.toml                # guarda de supply-chain (minimumReleaseAge)
├── tsconfig.json              # alias @/* -> ./src/*
├── vite.config.ts
├── eslint.config.js / .prettierrc / .prettierignore
└── src/
    ├── styles.css             # design tokens + Tailwind v4
    ├── router.tsx             # createRouter + QueryClient
    ├── start.ts               # instancia de TanStack Start
    ├── server.ts              # entry SSR (wrapper de errores)
    ├── routeTree.gen.ts       # AUTOGENERADO — no editar
    ├── routes/
    ├── components/
    │   ├── home/              # secciones del Home
    │   ├── layout/            # Navbar, Footer
    │   ├── servicios/         # ServiceCard
    │   └── ui/                # componentes base (propios + shadcn)
    ├── constants/             # nav, contacto, config de sitio
    ├── hooks/
    └── lib/                   # utils y reporte de errores
```

---

## 2. Estado actual del desarrollo

### Completamente implementado y funcionando

- **Sistema de diseño**: todos los tokens CSS (color, tipografía, espaciado, radios, sombras, transiciones, animaciones) definidos en `src/styles.css` y expuestos a Tailwind vía `@theme inline`.
- **Layout global** (`src/routes/__root.tsx`): shell HTML, `<HeadContent />`, metadatos SEO base, carga de Google Fonts por `<link>`, `QueryClientProvider`, Navbar + Footer alrededor del `<Outlet />`, páginas 404 y de error propias.
- **Navbar**: navegación desktop, transparencia según scroll, drawer móvil, CTA "Reservar cita", contenedor centrado a 1200px.
- **Footer**: 3 columnas (marca + redes, links, contacto/horarios), alineación responsive.
- **Home (`/`)**: las 7 secciones completas y funcionales con metadatos SEO propios.
- **Componentes base de marca**: `Button` (4 variantes × 3 tamaños), `Badge` (2 variantes), `SectionHeader` (eyebrow/título/descripción, alineación, `titleSize`).
- **Utilidades**: `cn`, `formatPrice` (COP, sin decimales), `formatDuration` (min → `1h 30min`).
- **Constantes centralizadas**: `NAV_LINKS`, `SOCIAL_LINKS`, `CONTACT_INFO`, `SITE_CONFIG`.

### Parcialmente implementado

- **Contenido del Home**: la estructura es final, pero **toda la data es placeholder** (servicios, precios, testimonios, FAQ, imágenes de `placehold.co`, teléfono `+57 300 000 0000`, WhatsApp `573000000000`).
- **Navegación**: `NAV_LINKS` apunta a `/servicios`, `/tienda`, `/galeria`, `/sobre-nosotros`, `/contacto`, pero **esas rutas no existen** → todos esos links caen en el 404.
- **`ServiceCard`**: componente listo y reutilizable, pero solo se consume desde el Home.
- **react-query**: `QueryClient` provisto, aún sin queries ni loaders.
- **Librerías instaladas sin uso**: react-hook-form, zod, sonner, recharts, date-fns, la mayoría de componentes shadcn.

### Pendiente / no iniciado

- Páginas: Servicios, Tienda, Galería, Sobre nosotros, Contacto.
- Backend (Lovable Cloud): base de datos, autenticación, storage, server functions.
- Sistema de reservas (agenda, disponibilidad, confirmación).
- Catálogo de tienda, carrito y pagos.
- Envío de formularios (email/registro en base de datos).
- Imágenes reales (fotografía del salón, portafolio, equipo).
- Analítica, sitemap, `robots.txt`, JSON-LD de negocio local.
- Tests automatizados (ninguno configurado).

---

## 3. Archivos y componentes creados

### Raíz

| Archivo | Descripción |
| --- | --- |
| `AGENTS.md` | Notas y convenciones para agentes/desarrolladores. |
| `components.json` | Config de shadcn/ui: estilo New York, base slate, alias `@/`. |
| `bunfig.toml` | Lockfile de texto y guarda de 24 h para versiones nuevas de paquetes. |
| `tsconfig.json` | TS estricto, `moduleResolution: Bundler`, alias `@/*`. |
| `vite.config.ts` | Envuelve la config de Lovable; redirige el entry SSR a `src/server.ts`. |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Lint y formato. |

### `src/`

| Archivo | Descripción |
| --- | --- |
| `styles.css` | Design tokens, base de Tailwind v4, keyframes y utilidades de animación. |
| `router.tsx` | Crea el router con `QueryClient` en el contexto y scroll restoration. |
| `start.ts` | Instancia de TanStack Start (middleware de cliente). |
| `server.ts` | Entry SSR con captura/reporte de errores. |
| `routeTree.gen.ts` | Árbol de rutas autogenerado (**no editar a mano**). |

### `src/routes/`

| Archivo | Descripción |
| --- | --- |
| `__root.tsx` | Shell HTML, head/SEO global, fonts, providers, Navbar/Footer, 404 y error boundary. |
| `index.tsx` | Home `/`: compone las 7 secciones y define su head SEO propio. |
| `README.md` | Convenciones de file-based routing del template. |

### `src/components/home/`

| Archivo | Descripción |
| --- | --- |
| `HeroBanner.tsx` | Hero a viewport completo con overlay, tipografía animada, CTAs y stats de marca. |
| `PropuestaValor.tsx` | Split de historia de marca + 3 tarjetas de valores centradas con borde superior en hover. |
| `ServiciosDestacados.tsx` | Grid de servicios destacados usando `ServiceCard`. |
| `GaleriaHome.tsx` | Grid tipo masonry (3 col × 180px, con spans) y overlay "Ver más →" en hover. |
| `Testimonios.tsx` | Carrusel de testimonios con Embla, autoplay y dots de paginación. |
| `FAQ.tsx` | Acordeón accesible de preguntas frecuentes. |
| `CTAFinal.tsx` | Sección final de conversión con CTA de reserva y enlace a WhatsApp. |

### `src/components/layout/`

| Archivo | Descripción |
| --- | --- |
| `Navbar.tsx` | Header fijo con transparencia por scroll, menú desktop, drawer móvil y CTA. |
| `Footer.tsx` | Footer de 3 columnas con marca, redes, links de navegación y datos de contacto. |

### `src/components/servicios/`

| Archivo | Descripción |
| --- | --- |
| `ServiceCard.tsx` | Tarjeta de servicio: imagen 180px, badge, título, descripción, precio/duración y botón "Reservar →". |

### `src/components/ui/`

| Archivo | Descripción |
| --- | --- |
| `Button.tsx` | Botón de marca: variantes `primary/secondary/accent/ghost`, tamaños `sm/md/lg`. |
| `Badge.tsx` | Etiqueta pill en mono uppercase: variantes `default` y `primary`. |
| `SectionHeader.tsx` | Encabezado de sección: eyebrow, título display italic, descripción, alineación y `titleSize`. |
| `accordion, alert, aspect-ratio, avatar, breadcrumb, card, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, popover, …` | Primitivas shadcn/ui del template (mayoría aún sin usar; `accordion` respalda el FAQ). |

### `src/constants/`, `src/hooks/`, `src/lib/`

| Archivo | Descripción |
| --- | --- |
| `constants/index.ts` | `NAV_LINKS`, `SOCIAL_LINKS`, `CONTACT_INFO`, `SITE_CONFIG`. |
| `hooks/use-mobile.tsx` | Hook de breakpoint móvil. |
| `lib/utils.ts` | `cn`, `formatPrice` (COP), `formatDuration`. |
| `lib/error-capture.ts` | Captura de errores en cliente. |
| `lib/error-page.ts` | Render de página de error de bajo nivel. |
| `lib/lovable-error-reporting.ts` | Reporte de errores al entorno Lovable. |

---

## 4. Sistema de diseño

Todos los valores viven en `:root` de `src/styles.css` y se re-exponen a Tailwind con `@theme inline`. **Regla:** nunca hardcodear colores ni tamaños en componentes; usar siempre `var(--token)`.

### Colores

```css
/* Base */
--color-bg: #F7F5F0;  --color-bg-alt: #EFECE5;  --color-surface: #FFFFFF;
/* Marca (verde profundo) */
--color-primary: #1C3D35;  --color-primary-lt: #2A5C50;  --color-primary-dim: #0F2420;
/* Acento (dorado) */
--color-accent: #C8A96E;  --color-accent-lt: #E8D5A8;  --color-accent-dim: #9A7D4A;
/* Texto */
--color-text-primary: #1A1A1A;  --color-text-secondary: #5A5A5A;
--color-text-muted: #9A9A9A;    --color-text-inverse: #F7F5F0;
/* Estados */
--color-success: #2D6A4F;  --color-warning: #D4840A;  --color-error: #C0392B;
/* Bordes */
--color-border: #E0DDD5;  --color-border-strong: #C8C4BA;
```

### Tipografía

```css
--font-display: 'Cormorant Garamond', Georgia, serif;  /* títulos, casi siempre italic */
--font-body:    'Inter', system-ui, sans-serif;        /* cuerpo y botones */
--font-mono:    'DM Mono', monospace;                  /* eyebrows, badges, metadatos */
```

- Escala: `--text-xs` (0.75rem) → `--text-6xl` (3.75rem).
- Pesos: `--weight-light` 300 → `--weight-bold` 700.
- Interlineado: `--leading-tight` 1.15 · `snug` 1.35 · `normal` 1.6 · `relaxed` 1.75.
- Tracking: `--tracking-tight` −0.02em → `--tracking-widest` 0.2em.
- Títulos responsivos: secciones grandes `clamp(2rem, 4vw, 3rem)`; secundarios `clamp(1.75rem, 3vw, 2.5rem)`.

### Espaciado, radios, sombras, movimiento

- Espaciado: `--space-1` … `--space-24`.
- Secciones: `--section-padding-y: 6rem`, `--section-padding-y-sm: 4rem`, `--container-max: 1200px`, `--container-padding: 1.5rem`.
- Radios: `--radius-sm` 4px … `--radius-2xl` 24px, `--radius-full` 9999px.
- Sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-card` (todas tintadas en verde marca).
- Transiciones: `--transition-fast` 150ms … `--transition-slower` 600ms cubic-bezier.
- Animaciones: `.animate-fade-in-up`, `.animate-scale-in-x`, `.animate-bounce-y` + respeto de `prefers-reduced-motion`.

### Componentes UI base

**`<Button>`** (`src/components/ui/Button.tsx`) — extiende `ButtonHTMLAttributes`.

| Prop | Valores | Default |
| --- | --- | --- |
| `variant` | `primary` (verde sólido), `secondary` (outline verde), `accent` (dorado), `ghost` (outline claro sobre fondo oscuro) | `primary` |
| `size` | `sm` (px-5 py-2), `md` (px-8 py-3), `lg` (px-10 py-4) | `md` |

Base: `border-radius: var(--radius-full)`, `min-h-[44px]`, `whitespace-nowrap`, `tracking-wide`.

**`<Badge>`** — `variant`: `default` (dorado claro) | `primary` (verde). Pill en mono uppercase con tracking wider.

**`<SectionHeader>`** — props: `eyebrow?`, `title`, `description?`, `align` (`left` | `center`), `titleSize?` (default `clamp(1.75rem, 3vw, 2.5rem)`), `className?`.

**`<ServiceCard>`** — imagen de 180px de alto, badge de categoría, título display, descripción, precio (`formatPrice`) y duración (`formatDuration`), botón "Reservar →".

### Fuentes: cómo se importan

Se cargan con `<link>` en el `head()` de `src/routes/__root.tsx` (preconnect a `fonts.googleapis.com` y `fonts.gstatic.com` + una hoja `css2?family=Cormorant+Garamond…&family=Inter…&family=DM+Mono…&display=swap`).

> **Importante:** no usar `@import url(...)` remoto en `src/styles.css`. Tailwind v4 usa Lightning CSS, que resuelve `@import` desde el filesystem y **rompe el build con ENOENT**. Los `<link>` del root son la única vía correcta.

---

## 5. Páginas implementadas

### `/` — Home (`src/routes/index.tsx`)

Head SEO propio: title, description, `og:title`, `og:description`, `og:type`, `twitter:card`. Sin `og:image` (aún no hay imagen absoluta real).

| # | Sección | Componente | Data |
| --- | --- | --- | --- |
| 1 | Hero | `HeroBanner` | Placeholder (copy, imagen de fondo, stats). |
| 2 | Propuesta de valor | `PropuestaValor` | Placeholder (historia + 3 valores). |
| 3 | Servicios destacados | `ServiciosDestacados` + `ServiceCard` | Placeholder: array local con nombres, precios y duraciones ficticios. |
| 4 | Galería / portafolio | `GaleriaHome` | Placeholder: 6 imágenes de `placehold.co`. |
| 5 | Testimonios | `Testimonios` (Embla) | Placeholder: testimonios inventados. |
| 6 | FAQ | `FAQ` | Placeholder: preguntas y respuestas de ejemplo. |
| 7 | CTA final | `CTAFinal` | Placeholder: `/contacto` (ruta inexistente) y `wa.me/573000000000`. |

Componentes globales presentes en todas las páginas: `Navbar`, `Footer` (desde `__root.tsx`).

**Datos conectados a fuentes reales: ninguno.** El 100 % del contenido es estático en el código.

### Rutas enlazadas pero no creadas

`/servicios`, `/tienda`, `/galeria`, `/sobre-nosotros`, `/contacto` → actualmente muestran el 404.

---

## 6. Problemas conocidos / deuda técnica

1. **Links roto en Navbar/Footer/CTAs**: 5 rutas referenciadas no existen todavía → 404.
2. **Todo el contenido es placeholder**, incluidos teléfono, email, WhatsApp e Instagram/Facebook/TikTok.
3. **Imágenes externas** desde `placehold.co`: dependencia de red en render, sin optimización ni `loading="lazy"` consistente.
4. **Estilos inline abundantes**: muchas secciones usan objetos `style` con `var(--token)` en lugar de utilidades Tailwind. Funciona y respeta los tokens, pero es verboso y difícil de hacer responsive (sin media queries en inline styles).
5. **Responsive no auditado a fondo**: el grid de la galería es fijo a 3 columnas; en móvil se comprime. Falta revisión en breakpoints < 768px.
6. **`SITE_CONFIG.url`** apunta a `https://adrianachavez.com` (dominio aún no configurado); no hay canonical ni `og:image` absolutos.
7. **Sin SEO técnico**: falta `sitemap.xml`, `robots.txt` y JSON-LD de `LocalBusiness`/`HairSalon`.
8. **`<Toaster />` de sonner no montado** en `__root.tsx`; cualquier `toast()` sería silencioso.
9. **Peso muerto de dependencias**: gran parte de shadcn/ui, recharts y date-fns están instalados sin uso.
10. **Sin tests ni CI**; validación manual (typecheck + screenshots de Playwright).
11. **Accesibilidad pendiente de auditoría**: contraste del dorado sobre fondos claros, focus rings visibles, `aria-label` en el drawer y en los dots del carrusel.
12. **Sin capa de datos**: no hay tipos compartidos (`Service`, `Product`, `Testimonial`) ni módulo de contenido; cada componente declara su propio array.

---

## 7. Próximos pasos

Orden sugerido:

1. **Tipos y contenido compartido**: crear `src/data/` (o `src/content/`) con tipos `Service`, `Product`, `GalleryItem`, `Testimonial`, `FaqItem` y mover los arrays fuera de los componentes.
2. **Crear las rutas faltantes** para eliminar los 404: `/servicios`, `/galeria`, `/sobre-nosotros`, `/contacto`, `/tienda` (cada una con su `head()` propio y único).
3. **Página Servicios**: listado por categorías reutilizando `ServiceCard` + detalle de servicio.
4. **Página Contacto**: formulario con react-hook-form + zod, datos de `CONTACT_INFO`, mapa y CTA de WhatsApp.
5. **Página Galería**: grid completo con filtros por categoría y lightbox.
6. **Página Sobre nosotros**: historia, equipo, certificaciones.
7. **Habilitar Lovable Cloud** (base de datos + storage + auth) y modelar: `services`, `products`, `gallery_items`, `testimonials`, `bookings`, `contact_messages`, con RLS y GRANTs.
8. **Migrar contenido de placeholder a base de datos** y consumirlo con loaders de ruta + `useSuspenseQuery`.
9. **Sistema de reservas**: disponibilidad, creación de cita, notificación por email al salón y a la clienta.
10. **Tienda**: catálogo, ficha de producto, carrito y pasarela de pagos.
11. **Imágenes reales**: subir a storage, servir optimizadas, añadir `og:image` absoluto por ruta.
12. **SEO técnico y analítica**: sitemap, robots, JSON-LD `HairSalon`, analytics.
13. **QA final**: responsive por breakpoint, accesibilidad, Lighthouse, publicación con dominio propio.

---

## 8. Variables de entorno requeridas

Hoy el proyecto **no necesita ninguna variable** (todo es estático). Las siguientes harán falta al conectar servicios:

| Variable | Ámbito | Para qué |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | cliente | URL del backend de Lovable Cloud. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | cliente | Clave publicable (segura en el bundle). |
| `SUPABASE_SERVICE_ROLE_KEY` / secret equivalente | servidor | Operaciones privilegiadas en server functions. |
| `LOVABLE_API_KEY` | servidor | AI Gateway, si se añaden funciones de IA. |
| `RESEND_API_KEY` (o proveedor equivalente) | servidor | Envío de emails de reserva y contacto. |
| `WHATSAPP_PHONE` | ambos | Número real de WhatsApp para los CTAs. |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | servidor | Pagos de la tienda. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | cliente | Checkout en el navegador. |
| `VITE_GA_MEASUREMENT_ID` | cliente | Analítica. |

**Reglas:**
- Solo las variables con prefijo `VITE_` llegan al navegador (`import.meta.env.VITE_*`).
- Las variables de servidor se leen con `process.env['X']` **dentro** del `.handler()` de la server function, nunca en el scope del módulo.
- Las claves privadas se añaden en Project Settings → Secrets, jamás en el código ni en un `.env` versionado.

---

## 9. Comandos útiles

```bash
# Instalar dependencias (se usa bun; bunfig.toml aplica una guarda de 24h)
bun install

# Desarrollo (http://localhost:8080)
bun run dev

# Build de producción (target edge / Cloudflare Workers)
bun run build

# Build en modo development (incluye prerender; útil para detectar errores de SSR)
bun run build:dev

# Servir el build localmente
bun run preview

# Lint y formato
bun run lint
bun run format

# Typecheck sólo de tipos
bunx tsgo
```

---

## 10. Notas para el desarrollador

### Arquitectura

- **El router es TanStack Router y no se cambia.** No instalar `react-router-dom` ni crear `src/pages/` o `App.tsx`. Cada página es un archivo en `src/routes/`; `routeTree.gen.ts` se regenera solo.
- **No crear `src/routes/_app/index.tsx`**: duplica la ruta `/`. El único layout raíz es `__root.tsx`, y todo layout padre debe renderizar `<Outlet />`.
- **Lógica de servidor**: `createServerFn` desde `@tanstack/react-start` para llamadas internas; rutas HTTP crudas (webhooks, cron, APIs públicas) en `src/routes/api/public/*` con verificación del emisor dentro del handler.
- **Runtime edge**: no usar `child_process`, `sharp`, `canvas`, `puppeteer` ni paquetes que exijan filesystem real o addons nativos.

### Convenciones de código

- Alias de imports: `@/` → `src/` (ej. `@/components/ui/Button`).
- **Nunca hardcodear colores** (`text-white`, `bg-black`, `bg-[#hex]`): usar siempre `var(--color-*)`.
- Componentes de marca en **PascalCase** (`Button.tsx`, `SectionHeader.tsx`); primitivas shadcn en **kebab-case** (`accordion.tsx`). Ante conflicto, prevalece el componente de marca.
- Los títulos usan `--font-display` en italic; los eyebrows y metadatos usan `--font-mono` en uppercase con tracking amplio.
- Copy del sitio en **español (Colombia)**; precios formateados con `formatPrice` (COP, sin decimales).

### Estándares visuales acordados (aplican a toda página o sección nueva)

- Contenedor de sección: `maxWidth: 1200px` + `margin-left/right: auto` + `padding: 0 1.5rem`.
- Padding vertical de sección: mínimo `6rem` arriba y abajo.
- Botones: mínimo `padding: 12px 32px`, `border-radius: var(--radius-full)`, `min-height: 44px`; el texto nunca pegado al borde.
- Cards: `padding` interno mínimo `1.5rem`.
- Imágenes de cards pequeñas: altura fija (ej. `180px`), **no** `aspect-ratio: 16/9`.
- Grids con `grid-row: span 2` requieren `grid-template-rows` explícito, o el grid colapsa.

### Trampas ya encontradas (no repetir)

- `@import url(...)` remoto en `src/styles.css` **rompe el build** (Lightning CSS resuelve desde el filesystem). Las fuentes van por `<link>` en `__root.tsx`.
- No existen en este template: `@/hooks/use-toast`, `@/components/ui/toaster`, `react-helmet-async`, `src/App.tsx`. Para toasts: `sonner` + `@/components/ui/sonner`. Para metadatos: la opción `head()` de la ruta.
- Cada ruta de contenido necesita su propio `head()` con title/description/og únicos; el `head()` de `__root.tsx` no cuenta como el de `/`.
