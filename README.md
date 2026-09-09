# Adriana Chávez - Hair Salon Management System

Sistema integral de gestión de citas, clientas e inventario para el salón de belleza de Adriana Chávez. Construido con una estética moderna, elegante y premium, este sistema web permite administrar de manera eficiente la agenda diaria de los profesionales, el historial completo de los clientes y el control de inventario de productos.

## Tecnologías utilizadas

El proyecto está desarrollado utilizando un *stack* tecnológico moderno para garantizar un alto rendimiento y escalabilidad:

- **Frontend:**
  - [React](https://reactjs.org/) - Biblioteca principal para la interfaz de usuario.
  - [Vite](https://vitejs.dev/) - Entorno de desarrollo ultrarrápido y empaquetador.
  - [TanStack Start](https://tanstack.com/start) - Framework SSR + enrutamiento con seguridad de tipos (*type-safe*).
  - [Tailwind CSS v4](https://tailwindcss.com/) - Framework de utilidades (config en `src/styles.css`).
  - [Date-fns](https://date-fns.org/) - Manipulación y formato avanzado de fechas.
  - [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei) - Elemento 3D del Hero.

- **Backend & Base de Datos:**
  - [Supabase](https://supabase.com/) - Base de datos PostgreSQL alojada en la nube y autenticación.

- **Iconografía:**
  - [Lucide React](https://lucide.dev/) - Iconos modernos y personalizables.

## Instalación

Sigue estos pasos para configurar el entorno de desarrollo localmente:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/adriana-chavez.git
   cd adriana-chavez
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   VITE_SITE_URL=http://localhost:8080
   ```

## Uso

Una vez que las dependencias estén instaladas y el archivo `.env.local` configurado, inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite elige automáticamente un puerto libre (normalmente `8080` u `8081`). Revisa el log de arranque para confirmar la URL exacta.

### Scripts disponibles:
- `npm run dev`: Inicia el servidor de desarrollo con *Hot Module Replacement* (HMR).
- `npm run build`: Transpila y optimiza la aplicación para producción.
- `npm run preview`: Sirve de forma local la carpeta generada por el build de producción para verificarla.

## Panel de Administración

Accede en `/admin/login` con las credenciales de Supabase Auth. El panel incluye:
- 📅 **Calendario de citas** — gestión visual mensual con detalle por día.
- 👥 **CRM de clientas** — registro, historial y ficha clínica.
- 📦 **Inventario** — control de stock virtual y físico.
- 📊 **Reportes** — ingresos por servicios y productos.

## Licencia

Este código se distribuye bajo la licencia **MIT**, lo que permite su uso comercial, modificación, distribución y uso privado de forma libre y gratuita.

