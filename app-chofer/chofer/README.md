# Recolecta Celaya - App Chofer

Esta es la aplicación móvil operativa para los conductores de camiones del ecosistema **Recolecta Celaya**. Su función principal es emitir la telemetría del vehículo para que pueda ser rastreado en tiempo real por los ciudadanos y los administradores de la ciudad.

## Características Principales

*   **Emisión de Telemetría GPS:** Captura en tiempo real las coordenadas del hardware del dispositivo móvil.
*   **Sincronización Continua:** Envía de forma ininterrumpida y en segundo plano la ubicación exacta (latitud y longitud) a la base de datos centralizada.
*   **Interfaz Optimizada:** Diseñada para requerir la mínima interacción por parte del operador del camión, funcionando principalmente de forma silenciosa una vez iniciada la ruta.

## Stack Tecnológico

*   **Framework:** Flutter (Dart)
*   **Backend as a Service:** Supabase (Autenticación, Base de datos PostgreSQL para las ingestas de GPS).
*   **Geolocalización:** Plugins nativos de Flutter para acceder a las coordenadas del dispositivo (`geolocator`).

## Cómo ejecutar el proyecto

1. Asegúrate de tener instalado Flutter y Dart.
2. Clona este repositorio y accede a esta carpeta (`app-chofer/chofer`).
3. Ejecuta `flutter pub get` para instalar las dependencias.
4. Conecta el dispositivo móvil destinado al operador del camión (con el GPS encendido).
5. Ejecuta `flutter run` para compilar e iniciar la aplicación.
