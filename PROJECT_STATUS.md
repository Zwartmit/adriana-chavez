# PROJECT_STATUS.md — Adriana Chávez

> Informe de estado del proyecto. Última actualización: 18 de agosto de 2026.

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
| Componentes propios | `Button`, `Badge`, `SectionHeader` en `src/components/ui/` | Únicos 3 archivos que quedan en `ui/` — ver §7 |
| Iconos | `lucide-react` | |
| Carrusel | `embla-carousel-react` | Usado en `Testimonios` |
| Data fetching | `@tanstack/react-query` | Instalado, `QueryClient` en contexto, sin queries reales aún |
| Formularios | `react-hook-form` + `zod` (instalados, sin uso real — `ContactoForm`/`ContactoForm` usan `useState` plano) | |
| Backend | **Supabase** (proyecto real conectado, no Lovable Cloud) | Ver §4 |
| Auth | Supabase Auth (`@supabase/supabase-js` + `@supabase/ssr`) | Funcional en `/admin/login` |
| Deploy target | Edge / Cloudflare Workers vía `nitro` (preset `cloudflare-module`) | Configurado, sin desplegar aún |

### Estructura del repositorio

```
/
├── PROJECT_STATUS.md          # este informe
├── package.json / package-lock.json
├── tsconfig.json              # alias @/* -> ./src/*
├── vite.config.ts
├── .env.local                 # credenciales reales — NO se sube a git
├── .claude/launch.json        # config del preview del harness (dev server)
├── supabase/
│   ├── schema.sql             # 14 tablas + 1 vista — YA EJECUTADO en Supabase
│   └── rls.sql                # políticas RLS — YA EJECUTADO en Supabase
└── src/
    ├── styles.css              # design tokens Noir Couture + Tailwind v4
    ├── routeTree.gen.ts        # AUTOGENERADO — no editar
    ├── routes/                 # una carpeta/archivo por página (file-based routing)
    ├── components/
    │   ├── home/                # 7 secciones del Home
    │   ├── layout/               # Navbar, Footer
    │   ├── servicios/            # ServiceCard, ServiciosFiltros, ServiciosGrid
    │   ├── galeria/               # GaleriaFiltros, GaleriaGrid, Lightbox
    │   ├── nosotros/               # EquipoGrid
    │   ├── contacto/                # ContactoForm, MapaContacto
    │   ├── tienda/                   # ProductCard, ProductosGrid, TiendaFiltros, CartDrawer
    │   └── ui/                        # Button, Badge, SectionHeader (marca propia)
    ├── constants/index.ts       # NAV_LINKS, SOCIAL_LINKS, CONTACT_INFO, SITE_CONFIG
    └── lib/
        ├── cart/                # CartContext (Context API), types
        ├── supabase/            # client.ts, server.ts, types.ts, auth.ts
        └── utils.ts             # cn, formatPrice, formatDuration
```

---

## 2. Estado de cada página y componente

### Páginas (`src/routes/`) — todas completas y navegables, sin 404

| Ruta | Archivo | Estado |
| --- | --- | --- |
| `/` | `routes/index.tsx` | ✅ Completa. 7 secciones (Hero, Propuesta de valor, Servicios destacados, Galería, Testimonios, FAQ, CTA final). Data placeholder. |
| `/servicios` | `routes/servicios.tsx` | ✅ Completa. Hero + buscador/filtros + grid de 12 servicios + estado vacío. Data placeholder. |
| `/galeria` | `routes/galeria.tsx` | ✅ Completa. Hero + filtros por categoría + grid masonry de 18 items + Lightbox con navegación por teclado. |
| `/sobre-nosotros` | `routes/sobre-nosotros.tsx` | ✅ Completa. Hero + historia + Misión/Visión/Valores (glass-champagne) + equipo (4 estilistas) + cifras. |
| `/contacto` | `routes/contacto.tsx` | ✅ Completa. Hero + formulario (envío simulado, sin backend real) + columna de info (glass) + mapa placeholder + horarios/canales + FAQ acordeón. |
| `/tienda` | `routes/tienda/index.tsx` | ✅ Completa. Hero + filtros (búsqueda/categoría/orden) + grid de 16 productos + paginación visual (no funcional). |
| `/tienda/$slug` | `routes/tienda/$slug.tsx` | ✅ Completa. Breadcrumb, galería de imágenes, selector de cantidad, tabs (Descripción/Características/Reseñas), productos relacionados. |
| `/admin/login` | `routes/admin/login.tsx` | ✅ Completa y **conectada a Supabase Auth real**. Diseño glass-champagne. |
| `/admin` | `routes/admin/index.tsx` | ✅ Guard de sesión funcional (`getSession()` → redirige a `/admin/login` si no hay sesión). Placeholder "Panel de Administración — Brandon"; el panel real se construye en Antigravity. |

Todas las páginas comparten `Navbar` + `Footer` desde `routes/__root.tsx`, más `CartDrawer` (montado globalmente, se abre desde cualquier página).

### Carrito de compra

- `src/lib/cart/CartContext.tsx` — Context API con `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`, `isDrawerOpen`/`openDrawer`/`closeDrawer`.
- `CartDrawer.tsx` — panel lateral (`z-index: 60`, por encima del navbar `z-index: 50`), se abre automáticamente al agregar un producto o al hacer clic en el ícono del navbar.
- **No persiste** entre recargas (no usa `localStorage`) — el carrito se vacía al refrescar la página.
- No hay checkout real ni ruta `/tienda/carrito` — los botones "Ir al checkout"/"Comprar ahora" apuntan ahí pero la ruta no existe todavía.

### Componentes de marca (`src/components/ui/`)

Solo quedan 3 (los ~37 componentes shadcn/ui sin usar se eliminaron durante el rebrand — ver §7):

- **`Button`** — variantes `primary | secondary | accent | ghost` × tamaños `sm | md | lg`.
- **`Badge`** — variantes `default` (dorado translúcido) | `primary` (dorado sólido).
- **`SectionHeader`** — `eyebrow?`, `title`, `description?`, `align`, `titleSize?`, `titleColor?` (para forzar contraste sobre fondos claros/dorados).

### Data

**Todo el contenido sigue siendo placeholder**: servicios, productos, testimonios, FAQ, equipo, imágenes (`placehold.co`), teléfono `+57 300 000 0000`, WhatsApp `573000000000`, redes sociales de ejemplo. Cada componente declara su propio array local — no hay una capa de datos compartida ni conexión real a Supabase desde el frontend público todavía (ver Fase A).

---

## 3. Design system — Noir Couture

El sitio pasó por un rebrand completo: del verde esmeralda + dorado cálido original a **Noir Couture** (negro profundo + champán dorado + glassmorphism). Todos los tokens viven en `:root` de `src/styles.css` y se re-exponen a Tailwind vía `@theme inline`. **Regla del proyecto: nunca hardcodear colores — siempre `var(--color-*)`.**

### Paleta actual

```css
/* Fondos */
--color-bg: #0A0A0B;        --color-bg-alt: #111213;
--color-surface: #181818;   --color-surface-alt: #202020;

/* Dorado — color principal de marca */
--color-primary: #E8C97A;   --color-primary-lt: #F0D99A;   --color-primary-dim: #C8A84A;
--color-accent: #E8C97A;    --color-accent-lt: rgba(232,201,122,0.12);   --color-accent-dim: #C8A84A;

/* Texto */
--color-text-primary: #F5F2EB;
--color-text-secondary: rgba(245,242,235,0.55);
--color-text-muted: rgba(245,242,235,0.30);
--color-text-inverse: #0A0A0B;   /* SOLO para texto sobre fondo dorado (--color-primary/--color-accent) */

/* Estados */
--color-success: #4CAF80;  --color-warning: #D4A84B;  --color-error: #E05252;

/* Bordes */
--color-border: rgba(255,255,255,0.08);
--color-border-strong: rgba(255,255,255,0.14);
--color-border-gold: rgba(232,201,122,0.35);
```

> ⚠️ **Regla de contraste crítica:** `--color-text-inverse` (negro) solo es correcto sobre un fondo literalmente `var(--color-primary)` o `var(--color-accent)` (dorado). Sobre cualquier otro fondo (transparente, `--color-bg`, `--color-surface`, overlays oscuros) el texto debe ser `--color-text-primary` (marfil). Esto rompió visualmente medio sitio durante el rebrand porque el token cambió de significado (antes era "texto claro para fondo oscuro"; ahora es "texto negro para fondo dorado") — si se vuelve a tocar la paleta, revisar esto primero.

### Glass materials

Tres materiales reutilizables, definidos como clases en `styles.css` (además de los tokens `--glass-*`):

- **`.glass-obsidian`** — blanco translúcido (4%) + blur 16px. Para cards sobre fondo oscuro (ej. `ServiceCard`, `Testimonios`).
- **`.glass-champagne`** — dorado translúcido (7%) + blur 12px + borde dorado. Para paneles destacados (ej. login admin, Misión/Visión, tarjeta de rating flotante).
- **`.glass-frosted`** — negro semitransparente (72%) + blur 20px. Para el navbar al hacer scroll.

También hay utilidades `.gold-line` (línea decorativa degradada) y `.section-glow-left/right/center` (resplandor radial sutil sobre secciones oscuras).

### Tipografía (sin cambios respecto al diseño original)

```css
--font-display: 'Cormorant Garamond', Georgia, serif;  /* títulos, casi siempre italic */
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'DM Mono', monospace;                  /* eyebrows, precios, metadatos */
```

Se cargan por `<link>` en `head()` de `__root.tsx` (Google Fonts) — **nunca `@import url()` remoto en `styles.css`**, rompe el build (Lightning CSS resuelve `@import` desde el filesystem).

### Trampa técnica ya resuelta (importante si se toca `styles.css`)

El reset global `* { margin: 0; padding: 0; }` estaba declarado **sin `@layer`**, y en CSS cualquier regla sin capa le gana a **toda** regla dentro de una `@layer` — sin importar especificidad. Como las utilidades de Tailwind viven en `@layer utilities`, ese reset anulaba silenciosamente el padding/margin de clases como `px-10`, `py-4`, `gap-4` en **todo el sitio** (los botones se veían sin padding). Se corrigió envolviendo el reset en `@layer base { ... }`. Si en el futuro las utilidades de espaciado de Tailwind "no hacen nada", este es el primer sospechoso.

---

## 4. Backend — Supabase

**Proyecto real conectado** (no es un placeholder): `uqxzfyubxsudnamleebh.supabase.co`.

| Ítem | Estado | Cómo se verificó |
| --- | --- | --- |
| Cliente browser (`lib/supabase/client.ts`) | ✅ Listo | `createBrowserClient` tipado con `Database` |
| Cliente server (`lib/supabase/server.ts`) | ✅ Listo, sin usar aún | Para server functions futuras; `setAll` de cookies queda como no-op pendiente |
| `schema.sql` (14 tablas + 1 vista) | ✅ **Ejecutado en Supabase** | Verificado por REST: `categorias_servicios` devuelve las 5 filas semilla (Cabello, Color, Tratamiento, Uñas, Peinado) |
| `rls.sql` (políticas RLS) | ✅ Ejecutado (con reserva) | `clientes` (tabla staff-only) devuelve `[]` sin error vía `anon key`, consistente con RLS activo — pero no se verificó tabla por tabla |
| Auth (email/password) | ✅ Funcional | Probado en `/admin/login`: credenciales inválidas devuelven error correctamente vía llamada real a Supabase |
| Usuario admin (`92taylorgang92@gmail.com`) | ⚠️ **No verificado** | No se probó un login exitoso (no se tenía la contraseña). Falta confirmar que el usuario existe en Authentication → Users y que su fila en `perfiles` tiene `rol = 'admin'` |
| Frontend conectado a datos reales | ❌ No | Todo el contenido público sigue siendo arrays locales — ver Fase A |

### Las 14 tablas (`supabase/schema.sql`)

`perfiles` (extiende `auth.users`), `estilistas`, `categorias_servicios`, `servicios`, `clientes`, `citas`, `bloqueos_horario`, `categorias_productos`, `productos`, `inventario` (+ vista `inventario_completo`), `movimientos_inventario`, `ordenes`, `items_orden`, `testimonios`, `galeria`, `reportes_caja`.

### RLS — resumen de política

- **Público (sin auth):** `servicios`/`productos`/`galeria` activos, `testimonios` aprobados, categorías, `estilistas` activos.
- **Solo staff (`admin`/`estilista`):** `clientes`, `citas`, `bloqueos_horario`, `inventario`, `movimientos_inventario`.
- **Solo `admin`:** `ordenes`, `reportes_caja`, gestión (INSERT/UPDATE/DELETE) de servicios/productos/galería/testimonios/estilistas.
- Helpers SQL: `public.es_admin()`, `public.es_staff()`.

---

## 5. Variables de entorno requeridas

Definidas en `.env.local` (raíz del proyecto, **no versionado** — ver confirmación abajo). Solo nombres, sin valores:

| Variable | Prefijo `VITE_` (visible en el bundle del navegador) | Para qué |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave anónima (segura para el cliente, respeta RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** (a propósito) | Clave privilegiada que salta RLS — nunca debe usarse en código que se compile al cliente |
| `VITE_WOMPI_PUBLIC_KEY` | Sí | Pasarela de pagos (Fase C) |
| `VITE_GOOGLE_MAPS_API_KEY` | Sí | Mapa de contacto (Fase C) |
| `VITE_SITE_URL` | Sí | URL base del sitio (canonical, `og:url`) |

**Confirmado:** `.env.local` está cubierto por el patrón `*.local` en `.gitignore` (verificado con `git check-ignore -v`).

**Regla:** cualquier variable con prefijo `VITE_` se inyecta en el bundle del navegador si algún código la referencia (`import.meta.env.VITE_*`) — nunca poner ahí una clave privilegiada. `SUPABASE_SERVICE_ROLE_KEY` se dejó deliberadamente sin ese prefijo por esta razón.

---

## 6. Plan de desarrollo pendiente

### Fase A — Datos reales
- Poblar Supabase con los 12+ servicios, 16 productos, equipo, galería y testimonios reales (reemplazar los arrays placeholder de cada componente).
- Conectar el frontend público a Supabase (`react-query` + tablas ya creadas) en vez de arrays locales.
- Subir fotografía real del salón/equipo/portafolio (hoy todo es `placehold.co`).

### Fase B — Panel de administración
- Calendario de citas (tablas `citas`, `bloqueos_horario` ya existen).
- CRM de clientes (tabla `clientes`).
- Inventario (tablas `inventario`, `movimientos_inventario`, vista `inventario_completo`).
- Reportes de caja (tabla `reportes_caja`).
- Se construye en **Antigravity**, no en esta sesión de Claude Code.

### Fase C — Integraciones
- Formulario de contacto real (hoy `ContactoForm` simula el envío con `setTimeout`, no persiste nada).
- Google Maps real en `/contacto` (hoy es un placeholder con ícono y botón a Google Maps externo).
- Wompi para pagos de la tienda (checkout no existe todavía).

### Fase D — Deploy
- Publicar en Vercel (o el target edge/Cloudflare Workers ya configurado vía `nitro`).
- Dominio propio (`SITE_CONFIG.url` hoy apunta a `adrianachavez.com`, sin configurar).
- PWA (manifest, service worker — nada de esto existe aún).

### Fase E — Agentes de IA (Fase 2 del proyecto)
- Agente de WhatsApp + automatización con n8n.
- Los campos de `citas` (`recordatorio_24h_enviado`, `recordatorio_2h_enviado`, `seguimiento_enviado`, `canal_origen`) y `reportes_caja.generado_por` ya están en el schema pensando en esto.

---

## 7. Decisiones técnicas importantes ya tomadas

1. **TanStack Start, no Next.js.** No introducir `react-router-dom`, `src/pages/`, `App.tsx` ni convenciones de Next — el proyecto no las usa.
2. **Tailwind v4 sin archivo de config.** Todo vive en `@theme inline` dentro de `src/styles.css`.
3. **Backend: Supabase, no Lovable Cloud.** Proyecto real ya creado y conectado.
4. **Estilado principal vía `style={{}}` inline con `var(--token)`**, no clases utilitarias de Tailwind para color/tipografía — decisión reforzada tras el bug de `@layer` (§3), que demostró que las utilidades de espaciado de Tailwind son frágiles en este setup. Tailwind se usa sobre todo para `flex`/`grid`/`hover:`/breakpoints.
5. **Se eliminaron ~37 componentes shadcn/ui sin usar** (`accordion`, `dialog`, `table`, etc.) — apuntaban a un sistema de tokens (`--card`, `--muted-foreground`, `--ring`...) que nunca existió en este proyecto. Solo se conservaron `Button`, `Badge`, `SectionHeader` (los únicos realmente importados en el sitio).
6. **Rebrand a Noir Couture** (dos rondas de ajuste de paleta) reemplazó el esquema original verde esmeralda + dorado cálido por negro neutro + dorado champán + glassmorphism.
7. **`SUPABASE_SERVICE_ROLE_KEY` sin prefijo `VITE_`** deliberadamente, para que Vite nunca la incluya en el bundle del cliente aunque algún día se importe por error.
8. **El carrito no persiste** (no hay `localStorage` ni sincronización con Supabase) — es estado de sesión de navegador únicamente, vía Context API.
9. **`npm`, no `bun`**, pese a que existe `bunfig.toml` en el repo — `bun` no está disponible en el entorno de desarrollo usado hasta ahora.

---

## 8. Archivos clave y qué hace cada uno

| Archivo | Qué hace |
| --- | --- |
| `src/styles.css` | Única fuente de verdad del design system: tokens de color/tipografía/espaciado/radios/sombras/transiciones, glass materials, config de Tailwind v4 (`@theme inline`). |
| `src/routes/__root.tsx` | Shell HTML, `<HeadContent />`, fonts (Google Fonts vía `<link>`), `QueryClientProvider`, `CartProvider`, `Navbar` + `Outlet` + `Footer` + `CartDrawer`, páginas 404/error. |
| `src/routeTree.gen.ts` | Árbol de rutas autogenerado por el plugin de TanStack Router — **nunca editar a mano**, se regenera solo al correr `npm run dev`. |
| `src/components/ui/Button.tsx` | Botón de marca; toda `padding`/`font-size` va vía clases Tailwind con valores entre corchetes (`px-[40px]`) para evitar el bug de `@layer`, y `font-size` vía `style` inline para evitar colisiones de `tailwind-merge`. |
| `src/lib/cart/CartContext.tsx` | Estado global del carrito (Context API), expone `useCart()`. |
| `src/components/tienda/CartDrawer.tsx` | Panel lateral del carrito, `z-index: 60` (por encima del navbar). |
| `src/lib/supabase/client.ts` / `server.ts` | Clientes Supabase tipados con `Database` (de `types.ts`). `client.ts` para componentes cliente, `server.ts` para uso futuro en server functions. |
| `src/lib/supabase/auth.ts` | `getSession`, `getUser`, `getUserRol`, `signIn`, `signOut`. |
| `src/lib/supabase/types.ts` | Tipos TypeScript del schema (escritos a mano, no generados por CLI — actualizar si cambia `schema.sql`). |
| `src/routes/admin/login.tsx` | Login real contra Supabase Auth, diseño glass-champagne. |
| `src/routes/admin/index.tsx` | Guard de sesión + placeholder del panel (el panel real se construye en Antigravity). |
| `supabase/schema.sql` | Las 14 tablas + vista + triggers — ya ejecutado en el proyecto real. |
| `supabase/rls.sql` | Políticas de Row Level Security — ejecutar siempre **después** de `schema.sql`. |
| `src/constants/index.ts` | `NAV_LINKS`, `SOCIAL_LINKS`, `CONTACT_INFO`, `SITE_CONFIG` — únicos datos verdaderamente centralizados hoy. |
| `.env.local` | Credenciales reales de Supabase + placeholders de Wompi/Google Maps. No versionado. |

---

## 9. Cómo retomar el proyecto en una nueva sesión

1. **Leer este archivo completo primero** (ver §10 abajo).
2. Confirmar que `.env.local` existe en la raíz con las credenciales reales — si no está, el sitio carga pero cualquier llamada a Supabase falla silenciosamente o con error de red.
3. Instalar dependencias: `npm install`.
4. Levantar el dev server: `npm run dev` (Vite elige puerto libre, normalmente 8080 u 8081 — revisar el log de arranque, no asumir el puerto).
5. Si vas a tocar `src/styles.css`: leer primero la nota de `@layer` en §3 antes de mover/quitar el reset global.
6. Si vas a tocar colores: la paleta vigente es la de §3 (Noir Couture) — no reintroducir los tonos verdes/dorados originales salvo instrucción explícita.
7. Antes de dar por "conectado a Supabase" cualquier feature nueva, verificar con una llamada REST real (como se hizo en §4) en vez de asumir — el schema puede estar desincronizado del código si alguien edita una tabla directo en el dashboard.
8. El panel de administración (Fase B) se construye en **Antigravity**, no en Claude Code — esta sesión solo deja `/admin/login` y el guard de `/admin` listos.
9. Antes de agregar una tabla o columna nueva a Supabase, actualizar `supabase/schema.sql` **y** `src/lib/supabase/types.ts` a mano (no hay generación automática de tipos configurada).

---

## 10. Cómo usar este archivo

Este archivo debe leerse **al inicio de cada nueva sesión de Claude Code** en este proyecto, antes de hacer cualquier cambio. Su propósito es restaurar de golpe el contexto completo — stack, estado real de cada página, decisiones de diseño ya tomadas, trampas técnicas ya resueltas y qué falta — sin tener que releer todo el código o repetir errores ya corregidos (como el bug de `@layer` o la confusión de `--color-text-inverse`).

Cuando termines un bloque de trabajo significativo (una fase completa, un fix importante, una decisión de arquitectura nueva), **actualiza este archivo** antes de cerrar la sesión: mueve lo que ya quedó hecho de "pendiente" a "completado", corrige cualquier dato que haya cambiado (paleta, tablas, rutas, variables de entorno) y anota cualquier trampa técnica nueva que hayas encontrado, para que la siguiente sesión no la vuelva a pisar.
