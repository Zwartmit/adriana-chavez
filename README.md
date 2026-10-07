# Adriana Chávez - Hair Salon Management & E-Commerce System

Sistema integral *Full-Stack* de gestión de citas, profesionales e inventario, junto con una tienda en línea y catálogo de servicios para el salón de belleza de Adriana Chávez. Construido con una estética moderna, elegante y premium, este sistema web permite tanto a las clientas comprar y agendar, como a los administradores gestionar toda la operación del salón.

## Características Principales

### 🌟 Interfaz Pública (Clientas)
- **Catálogo de Servicios y Productos**: Visualización de servicios y tienda de productos físicos de belleza.
- **Carrito de Compras y Checkout**: Flujo de e-commerce completo para adquirir productos.
- **Experiencia Premium**: Diseño moderno con efectos *glassmorphism*, temas adaptables, y optimizado para una navegación fluida.
- **Autenticación**: Registro e inicio de sesión para clientas.

### ⚙️ Panel de Administración (CRM & ERP)
- **Calendario de Citas Inteligente**: Vista mensual y panel diario para gestionar citas, duraciones y bloqueos de horario, respetando de manera estricta la zona horaria local (`America/Bogota`).
- **Gestión de Profesionales**: Creación de profesionales, asignación de colores en calendario, especialidades y **bloqueos de horario** (vacaciones, ausencias, pausas) con alertas de solapamiento de agenda.
- **Gestión de Clientas**: Historial de citas, compras y datos de contacto de toda la clientela.
- **Inventario**: Control estricto del stock de productos físicos y administración de los servicios del salón.
- **Gestión de Órdenes**: Seguimiento de pedidos de la tienda virtual, control de estados de envío (Pendiente, Enviado, Entregado) e impresión de tickets.
- **Integridad de Datos**: Empleo de funciones de servidor (RPC) en PostgreSQL y restricciones de llaves foráneas para operaciones complejas como el borrado seguro de profesionales que cuenten con agenda libre.

## Tecnologías utilizadas

El proyecto está construido sobre un *stack* moderno, garantizando alto rendimiento (SSR), SEO y excelente experiencia de desarrollo:

- **Frontend & Framework:**
  - [TanStack Start](https://tanstack.com/start) - Framework Full-Stack para React con Server-Side Rendering y enrutamiento con total seguridad de tipos (*type-safe*).
  - [React 19](https://react.dev/) - Biblioteca principal para la construcción de interfaces.
  - [Vite](https://vitejs.dev/) - Entorno de desarrollo rápido y empaquetador subyacente.
  - [Tailwind CSS v4](https://tailwindcss.com/) - Framework de utilidades para un diseño ágil y responsivo.
  - [Date-fns](https://date-fns.org/) + `TZDate` - Manipulación experta de fechas y horas para resolver ambigüedades UTC vs Local.
  - [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - Para renderizado e interacciones 3D (Hero publicitario).

- **Backend & Base de Datos:**
  - [Supabase](https://supabase.com/) - Ecosistema de backend proporcionando PostgreSQL en la nube, Autenticación y Storage.

## Instalación

Sigue estos pasos para configurar el entorno de desarrollo localmente:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Zwartmit/adriana-chavez.git
   cd adriana-chavez
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   VITE_SITE_URL=http://localhost:3000
   ```

## Uso y Scripts

Inicia el servidor de desarrollo en local:

```bash
npm run dev
```

### Comandos útiles:
- `npm run dev`: Inicia el servidor de desarrollo de Vite (HMR incluido).
- `npm run build`: Transpila y optimiza la aplicación (Client y SSR) lista para producción.
- `npm run preview`: Sirve de forma local la carpeta generada por el build de producción para probar el entorno de servidor.
- `npm run lint`: Ejecuta ESLint para analizar y mantener el estilo del código.
- `npm run format`: Formatea los archivos fuente usando Prettier.

## Estructura del Proyecto

- `src/routes/`: Sistema de rutas basado en archivos (TanStack Router). Aloja rutas públicas y protegidas (bajo el directorio `admin/`).
- `src/components/`: Componentes modulares, divididos entre UI genérica (`ui/`), secciones públicas y paneles de administración (`admin/`).
- `src/lib/`: Utilidades, clientes de red (Supabase) y declaración de tipos globales.
- `supabase/migrations/`: Historial de archivos SQL para las tablas, funciones y políticas de seguridad (RLS).

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**, permitiendo su uso comercial, modificación, distribución y uso privado de forma libre y gratuita.
