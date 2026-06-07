# Recolecta Celaya - App Ciudadana

Esta es la aplicación móvil para ciudadanos del ecosistema **Recolecta Celaya**, diseñada para brindar a los habitantes de la ciudad una herramienta integral para el rastreo de camiones recolectores de basura, educación ambiental y participación ciudadana.

## Características Principales

*   **Rastreo en Tiempo Real:** Visualización de la ubicación exacta de los camiones recolectores en el mapa de la ciudad.
*   **Geocodificación y Registro de Domicilio:** Permite registrar tu casa o lugar de trabajo utilizando búsqueda interactiva impulsada por OpenStreetMap (Nominatim).
*   **Alertas de Proximidad (Geofencing):** Recibe notificaciones push locales y alertas por voz (Text-To-Speech) cuando el camión está a menos de 15 minutos (o ~2.5 km) de tu domicilio registrado.
*   **Guía de Reciclaje:** Catálogo informativo sobre cómo separar adecuadamente los residuos.
*   **Reportes Ciudadanos:** Módulo para levantar quejas, incidencias o revisar avisos oficiales de la comunidad.

## Stack Tecnológico

*   **Framework:** Flutter (Dart)
*   **Backend as a Service:** Supabase (Autenticación, Base de datos PostgreSQL)
*   **Mapas y Geolocalización:** `flutter_map`, `latlong2`, `geolocator`, API de OpenStreetMap.
*   **Accesibilidad y Notificaciones:** `flutter_tts`, `flutter_local_notifications`.

## Estructura del Proyecto

*   `lib/screens/`: Pantallas de la aplicación (Login, Dashboard, Mapas, Reportes).
*   `lib/services/`: Lógica de negocio (Autenticación, Servicios de Ubicación, Notificaciones, Proximidad).
*   `lib/widgets/`: Componentes gráficos reutilizables.
*   `lib/database/`: Scripts SQL que representan la estructura del backend.

## Cómo ejecutar el proyecto

1. Asegúrate de tener instalado Flutter y Dart.
2. Clona este repositorio.
3. Ejecuta `flutter pub get` para instalar las dependencias.
4. Conecta un dispositivo físico o emulador.
5. Ejecuta `flutter run` para compilar e iniciar la aplicación.
