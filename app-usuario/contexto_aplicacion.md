# Contexto de la Aplicación: Recolecta Celaya

Este documento está diseñado para ser consumido por un Asistente de IA (LLM) u otro desarrollador para comprender rápidamente la arquitectura, el stack tecnológico, las dependencias y la lógica de negocio de la aplicación móvil **Recolecta Celaya**.

## 1. Descripción General
- **Proyecto:** Recolecta Celaya
- **Propósito:** App ciudadana para el seguimiento de camiones de recolección de basura, educación ambiental y reportes ciudadanos en Celaya, Gto.
- **Plataforma:** Flutter (Android/iOS)
- **Backend as a Service (BaaS):** Supabase (Base de datos PostgreSQL, Autenticación y Storage).

## 2. Dependencias Clave (`pubspec.yaml`)
El proyecto utiliza librerías modernas de Flutter para cubrir necesidades operativas y de mapa:
- **`supabase_flutter: ^2.8.4`**: SDK oficial para la conexión con la base de datos y la gestión de sesiones (`Supabase.instance.client.auth`).
- **`flutter_map: ^8.3.0`** y **`latlong2: ^0.9.1`**: Librería principal para renderizar mapas, usar mosaicos (TileLayers) de OpenStreetMap sin costo, y manipular coordenadas.
- **`geolocator: ^14.0.2`**: Plugin para acceder al hardware GPS del dispositivo y obtener la ubicación del usuario.
- **`flutter_local_notifications: ^17.1.2`** y **`permission_handler: ^11.3.1`**: Permite disparar notificaciones push de forma local en el dispositivo (utilizado para avisos de proximidad).
- **`flutter_tts: ^4.2.5`**: Motor *Text-To-Speech* para dotar de accesibilidad a la aplicación leyendo textos en voz alta.
- **`http: ^1.6.0`**: Para peticiones REST (ej. APIs externas de Nominatim/OSM).

## 3. Estructura del Código (`lib/`)

### Directorios
- `constants/`: Contiene variables globales y configuraciones visuales (ej. `app_colors.dart` con la paleta de colores).
- `screens/`: Todas las vistas de la aplicación utilizando `StatefulWidget` o `StatelessWidget`.
- `services/`: Lógica de negocio abstraída (Patrón Singleton), separada de la UI.
- `widgets/`: Componentes gráficos reutilizables (ej. botones, bottom bars).
- `database/`: Scripts SQL que representan la estructura del backend de Supabase.

### 4. Pantallas Principales (`lib/screens/`)
- **Autenticación:**
  - `login_screen.dart` / `registro_screen.dart`: Formularios de ingreso y registro enlazados a Supabase Auth.
- **Panel Central:**
  - `dashboard_screen.dart`: Pantalla "Home" tras autenticarse. Muestra un "ETA" simulado, botones de acción rápidos y arranca servicios pasivos (TTS y Notificaciones de Proximidad).
- **Mapas y Tracking:**
  - `mapa_camion_screen.dart`: Visualizador GPS. Usa un Timer periódico (cada 1s - 5s) para hacer ping a la base de datos y actualizar el marcador del camión en el mapa (`flutter_map`).
  - `edit_location_screen.dart`: Permite al usuario registrar/modificar su domicilio. Integra búsqueda interactiva y **Reverse Geocoding** (vía Nominatim API de OpenStreetMap) para centrar un marcador en las coordenadas exactas de su casa y guardarlas.
- **Módulos Secundarios:**
  - `waste_guide_screen.dart` / `waste_detail_screen.dart`: Catálogo informativo sobre separación de residuos.
  - `reports_screen.dart` / `alerts_screen.dart`: Vistas para enviar quejas o revisar el historial.
  - `avisos_screen.dart`: Módulo que lista comunicados generales para la colonia o la ciudad.

## 5. Servicios del Sistema (`lib/services/`)
- **`auth_service.dart`**: Abstrae las llamadas de Supabase para Login, Registro y Logout.
- **`location_service.dart`**: Centraliza peticiones HTTP (GET) al endpoint gratuito de Nominatim (OSM) para convertir cadenas de texto en Coordenadas (`searchAddress`) y coordenadas en cadenas de texto (`reverseGeocode`).
- **`notification_service.dart`**: Implementación de `flutter_local_notifications`. Gestiona permisos en Android 13+ y define el canal Android (`proximidad_camion_channel`) para mandar alertas push nativas.
- **`proximity_service.dart`**: Motor de tracking secundario. Compara la latitud/longitud del usuario (`domicilios_usuario`) con la del camión (`gps_carrito`). Emite una alerta usando el `NotificationService` si el camión rompe el umbral de distancia (< 2,500 metros o ~15 mins de ETA).
- **`voice_guide_service.dart`**: Provee retroalimentación por voz (TTS). Se invoca automáticamente en el arranque de pantallas para mejorar la accesibilidad a personas con debilidad visual.

## 6. Arquitectura de Base de Datos (Backend / PostgreSQL)
Las interacciones principales consumen un esquema altamente relacional alojado en Supabase (reflejado en `lib/database/script_0.sql`):
- `perfiles`: Datos extendidos que complementan a `auth.users` de Supabase.
- `domicilios_usuario`: Registra los puntos (latitud y longitud) designados por los usuarios como su "Casa", "Trabajo", etc. Fundamental para cruzar datos espaciales.
- `gps_ingestas` / `gps_carrito`: Tablas de telemetría por donde entran y se leen las coordenadas en tiempo real emitidas por el chofer del camión recolector.
- `camiones` y `rutas`: Entidades que asocian vehículos físicos con trayectos lógicos.
- `reportes_ciudadanos` y `avisos`: Gestión bidireccional de incidencias e información oficial.

## 7. Flujo de Navegación (`main.dart`)
- **`AuthWrapper`**: Es el widget raíz real (`initialRoute: '/'`). Escucha el estado de la sesión de Supabase:
  - Si no hay usuario -> Lanza `LoginScreen()`.
  - Si hay usuario activo -> Lanza `DashboardScreen()`.
- **Rutas (Routes):** Se usa un diccionario nativo estático `routes: {'/login': ..., '/dashboard': ...}` para saltar entre vistas utilizando `Navigator.pushNamed`.

## 8. Estado Actual de Desarrollo
Las siguientes "Historias de Usuario" y features clave ya han sido desarrollados:
- [x] Integración BaaS Supabase (Auth / Database Querying).
- [x] Lógica de mapas offline/online amigable (Flutter Map).
- [x] Geocodificación directa e inversa (OpenStreetMap API integrada nativamente).
- [x] Persistencia de coordenadas del domicilio del usuario.
- [x] Algoritmo de "Tracker" visual en tiempo real para el camión.
- [x] Sistema Background/Foreground de notificaciones (alertas locales basadas en umbral de radio geográfico).
- [x] Accesibilidad (TTS de bienvenida).
