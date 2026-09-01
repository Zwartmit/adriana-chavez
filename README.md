# Adriana Chávez - Hair Salon Management System

Sistema integral de gestión de citas, clientas e inventario para el salón de belleza de Adriana Chávez. Construido con una estética moderna, elegante y premium, este sistema web permite administrar de manera eficiente la agenda diaria de los estilistas, el historial completo de los clientes y el control de inventario de productos.

## Tecnologías utilizadas

El proyecto está desarrollado utilizando un *stack* tecnológico moderno para garantizar un alto rendimiento y escalabilidad:

- **Frontend:**
  - [React](https://reactjs.org/) - Biblioteca principal para la interfaz de usuario.
  - [Vite](https://vitejs.dev/) - Entorno de desarrollo ultrarrápido y empaquetador.
  - [Tailwind CSS](https://tailwindcss.com/) - Framework de utilidades para un diseño a medida.
  - [TanStack Router](https://tanstack.com/router) - Enrutamiento con seguridad de tipos (*type-safe*).
  - [Date-fns](https://date-fns.org/) - Manipulación y formato avanzado de fechas.

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
   Puedes usar `npm`, `yarn` o `pnpm`. Aquí el ejemplo con NPM:
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de acceso a Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

## Uso

Una vez que las dependencias estén instaladas y el archivo `.env` configurado, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
```

El servidor iniciará localmente (normalmente en `http://localhost:5173`). Abre esa URL en tu navegador para ver la aplicación.

### Scripts disponibles:
- `npm run dev`: Inicia el servidor de desarrollo con *Hot Module Replacement* (HMR).
- `npm run build`: Transpila y optimiza la aplicación para producción.
- `npm run preview`: Sirve de forma local la carpeta generada por el build de producción para verificarla.

## Licencia

Este código se distribuye bajo la licencia **MIT**, lo que permite su uso comercial, modificación, distribución y uso privado de forma libre y gratuita.
