# ♻️ Recolecta Celaya - Sistema Integral de Residuos Urbanos

Este repositorio (Monorepo) contiene el ecosistema completo de **Recolecta Celaya**, una plataforma digital diseñada para modernizar, rastrear en tiempo real y optimizar el servicio municipal de recolección de basura, mejorando la logística operativa y la comunicación directa con los ciudadanos.

## 🏗️ Arquitectura del Sistema

El ecosistema está compuesto por tres proyectos principales que se sincronizan en tiempo real mediante un Backend centralizado. Puedes explorar cada uno de ellos entrando a sus respectivas carpetas:

### 1. [App Ciudadana (app-usuario)](./app-usuario)
Aplicación móvil interactiva para los habitantes de la ciudad.
*   **Tecnologías:** Flutter (Android/iOS), OpenStreetMap (Nominatim).
*   **Funciones:** Rastreo de camiones en mapa interactivo en tiempo real, registro de domicilio mediante geocodificación inversa, alertas de proximidad (Geofencing / Notificaciones Push locales), Text-to-Speech (TTS) y envío de reportes ciudadanos.

### 2. [App para Choferes (app-chofer)](./app-chofer/chofer)
Aplicación móvil de uso interno para el personal operativo.
*   **Tecnologías:** Flutter.
*   **Funciones:** Emisión y sincronización ininterrumpida de telemetría GPS hacia la base de datos central.

### 3. [Panel Administrativo (panel-admin)](./panel-admin)
Dashboard de control web para la gestión operativa.
*   **Tecnologías:** Next.js, React, Tailwind CSS, Recharts, Leaflet.
*   **Funciones:** Visualización en vivo de la flota completa de camiones recolectores, gestión de reportes ciudadanos, emisión de comunicados oficiales y visualización de métricas de rendimiento.

---

## 🛠️ Stack Tecnológico Principal

*   **Frontend Web:** Next.js, React, Tailwind CSS.
*   **Frontend Mobile:** Flutter (Dart).
*   **BaaS (Backend as a Service):** Supabase (PostgreSQL, Auth, Storage).
*   **Servicios Geoespaciales:** `flutter_map`, `react-leaflet`, APIs de OpenStreetMap para mapas sin costo y geocodificación.

## 👨‍💻 Autor
Desarrollado por **[lufture](https://github.com/lufture)**.

> **Nota para evaluación / despliegue:**
> Dado que este es un monorepo, si deseas correr o desplegar alguno de los servicios, asegúrate de navegar primero a la carpeta correspondiente e instalar las dependencias locales (`flutter pub get` o `npm install`). Cada carpeta contiene su propio `README.md` con instrucciones detalladas.
