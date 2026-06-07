# Recolecta Celaya - Panel Administrativo

Este es el dashboard de administración web para el ecosistema **Recolecta Celaya**. Está diseñado para que los operadores, administradores de rutas y autoridades municipales gestionen y monitoreen de manera integral el servicio de recolección de basura.

## Características Principales

*   **Monitoreo en Vivo:** Visualización en tiempo real de toda la flota de camiones recolectores sobre un mapa interactivo de la ciudad, consumiendo directamente la telemetría emitida por las aplicaciones de los choferes.
*   **Gestión de Reportes:** Panel para revisar, dar seguimiento y resolver las quejas o incidencias reportadas por los ciudadanos.
*   **Comunicación Oficial:** Herramienta para publicar y difundir avisos generales o alertas a zonas específicas de la ciudad.
*   **Analítica y Métricas:** Visualización de gráficos de rendimiento, tiempos de ruta y estadísticas operativas del servicio.

## Stack Tecnológico

*   **Framework Core:** Next.js (React)
*   **Estilos y UI:** Tailwind CSS, `lucide-react` para iconografía.
*   **Mapas Interactivos:** `leaflet` y `react-leaflet` para el renderizado geoespacial de las rutas.
*   **Gráficos:** `recharts` para la analítica de datos.
*   **Backend y Conexión:** Cliente de Supabase (`@supabase/ssr` y `@supabase/supabase-js`) para consumir la base de datos PostgreSQL en tiempo real.

## Cómo ejecutar el proyecto en desarrollo

1. Clona el repositorio e ingresa a la carpeta `panel-admin`.
2. Instala las dependencias ejecutando:
   ```bash
   npm install
   # o utilizando pnpm: pnpm install
   ```
3. Configura las variables de entorno para la conexión con Supabase (revisa los archivos `.env` y `.local.env`).
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o pnpm dev
   ```
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador web.
