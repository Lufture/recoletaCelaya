# Integración Anónima — Guía para el Desarrollador Móvil

> **Base URL (local):** `http://localhost:3000`  
> **Base URL (producción):** `https://tu-dominio.vercel.app`  
> **Autenticación requerida:** ❌ Ninguno de estos endpoints requiere Bearer token.  
> **Restricciones de modo anónimo:** registrar colonia y registrar domicilio están bloqueados en backend.

---

## Flujo recomendado de integración

```
Primer uso o reinicio:
  ┌─────────────────────────────────────────────────────────┐
  │  1. Generar session_token  (en el dispositivo)          │
  │  2. POST /api/anonimos/sesion  → guardar sesion_id      │
  │  3. GET  /api/anonimos/permisos  → caché local          │
  │  4. GET  /api/anonimos/colonias-horarios → mostrar list │
  └─────────────────────────────────────────────────────────┘

Cuando el usuario selecciona su colonia:
  ┌─────────────────────────────────────────────────────────┐
  │  5. POST /api/anonimos/sesion  (misma token + colonia_id│
  │         para actualizar colonia asociada a la sesión)   │
  │  6. POST /api/anonimos/evento  tipo=consulta_colonia    │
  └─────────────────────────────────────────────────────────┘

Pantalla "¿Dónde está el camión?":
  ┌─────────────────────────────────────────────────────────┐
  │  7. GET  /api/anonimos/camion?token=<session_token>     │
  │         Si puede_ver=true → mostrar posición            │
  │         Si puede_ver=false → mostrar mensaje de espera  │
  │  8. POST /api/anonimos/evento  tipo=consulta_ubicacion  │
  └─────────────────────────────────────────────────────────┘

Si el usuario presiona "Activar notificaciones" (acción bloqueada):
  ┌─────────────────────────────────────────────────────────┐
  │  9. POST /api/anonimos/evento                           │
  │         tipo=intento_activar_notificaciones             │
  │  10. Mostrar pantalla de invitación a registrarse       │
  └─────────────────────────────────────────────────────────┘
```

---

## Paso 1 — Generar `session_token` en el dispositivo

El token debe:
- Ser **único por instalación** (no por sesión HTTP).
- **Persistirse** en `AsyncStorage` (React Native) o `SharedPreferences` / `UserDefaults`.
- **No ser un UUID aleatorio de corta vida**: debe sobrevivir reinicios de la app.

### Flutter (recomendado)

```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

Future<String> getOrCreateSessionToken() async {
  final prefs = await SharedPreferences.getInstance();
  String? token = prefs.getString('anon_session_token');
  if (token == null) {
    token = const Uuid().v4();
    await prefs.setString('anon_session_token', token);
  }
  return token;
}
```

### React Native

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

async function getOrCreateSessionToken() {
  let token = await AsyncStorage.getItem('anon_session_token');
  if (!token) {
    token = uuid.v4();
    await AsyncStorage.setItem('anon_session_token', token);
  }
  return token;
}
```

---

## Endpoint 1 — Registrar / refrescar sesión anónima

**`POST /api/anonimos/sesion`**

### Request

```json
{
  "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
  "colonia_id": null,
  "plataforma": "android",
  "app_version": "1.2.0",
  "modelo_dispositivo": "Samsung Galaxy A54"
}
```

> `colonia_id` es `null` en el primer registro. Se envía un UUID válido cuando el usuario selecciona su colonia.

### Response — 200 OK

```json
{
  "sesion_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Cuando el usuario selecciona colonia

```json
{
  "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
  "colonia_id": "f9e8d7c6-b5a4-3210-9876-543210fedcba"
}
```

### Errores

| Status | Causa |
|--------|-------|
| 400 | `session_token` no incluido o vacío |
| 500 | Error de base de datos |

### curl

```bash
# Primer registro (sin colonia)
curl -X POST http://localhost:3000/api/anonimos/sesion \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
    "plataforma": "android",
    "app_version": "1.2.0"
  }'

# Actualizar con colonia seleccionada
curl -X POST http://localhost:3000/api/anonimos/sesion \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
    "colonia_id": "f9e8d7c6-b5a4-3210-9876-543210fedcba"
  }'
```

---

## Endpoint 2 — Consultar permisos del modo anónimo

**`GET /api/anonimos/permisos`**

No requiere parámetros.

### Response — 200 OK

```json
{
  "data": [
    {
      "modo_usuario": "anonimo",
      "puede_registrar_domicilio": false,
      "puede_guardar_multiples_domicilios": false,
      "puede_recibir_notificaciones_push": false,
      "puede_configurar_alertas_domicilio": false,
      "puede_reportar_incidencias": false,
      "puede_ver_horarios_publicos": true,
      "puede_ver_avisos_publicos": true,
      "puede_ver_guia_separacion": true,
      "puede_ver_camion_solo_en_colonia": true
    },
    {
      "modo_usuario": "ciudadano_registrado",
      "puede_registrar_domicilio": true,
      "puede_guardar_multiples_domicilios": true,
      "puede_recibir_notificaciones_push": true,
      "puede_configurar_alertas_domicilio": true,
      "puede_reportar_incidencias": true,
      "puede_ver_horarios_publicos": true,
      "puede_ver_avisos_publicos": true,
      "puede_ver_guia_separacion": true,
      "puede_ver_camion_solo_en_colonia": false
    }
  ]
}
```

> **Recomendación:** cachear esta respuesta al inicio de la app. Solo cambia con nuevas versiones del sistema.

### curl

```bash
curl http://localhost:3000/api/anonimos/permisos
```

---

## Endpoint 3 — Colonias con horario público

**`GET /api/anonimos/colonias-horarios`**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `coloniaId` | UUID | No | Filtrar por colonia específica |

### Response — 200 OK (lista completa)

```json
{
  "data": [
    {
      "colonia_id": "f9e8d7c6-b5a4-3210-9876-543210fedcba",
      "colonia": "Fracc. Las Américas",
      "ruta_id": "11223344-5566-7788-9900-aabbccddeeff",
      "route_id": "RUTA-03",
      "ruta": "Ruta Norte",
      "horario_estimado": "Lunes a Sábado 7:00 AM – 10:00 AM",
      "hora_inicio_estimada": "07:00:00",
      "hora_fin_estimada": "10:00:00"
    },
    {
      "colonia_id": "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      "colonia": "Col. Centro",
      "ruta_id": "ffffffff-eeee-dddd-cccc-bbbbaaaabbbb",
      "route_id": "RUTA-01",
      "ruta": "Ruta Centro",
      "horario_estimado": "Lunes a Viernes 6:00 AM – 9:00 AM",
      "hora_inicio_estimada": "06:00:00",
      "hora_fin_estimada": "09:00:00"
    }
  ]
}
```

### curl

```bash
# Todas las colonias
curl http://localhost:3000/api/anonimos/colonias-horarios

# Filtrar colonia específica
curl "http://localhost:3000/api/anonimos/colonias-horarios?coloniaId=f9e8d7c6-b5a4-3210-9876-543210fedcba"
```

---

## Endpoint 4 — Consultar ubicación del camión

**`GET /api/anonimos/camion?token=<session_token>`**

### Response — camión visible (puede_ver: true)

El camión entró al punto de proximidad de la colonia del usuario.

```json
{
  "data": {
    "puede_ver": true,
    "motivo": "Ubicación visible para modo invitado",
    "colonia_id": "f9e8d7c6-b5a4-3210-9876-543210fedcba",
    "ruta_id": "11223344-5566-7788-9900-aabbccddeeff",
    "recorrido_id": "12345678-abcd-ef01-2345-678901234567",
    "camion_id": "99887766-5544-3322-1100-ffeeddccbbaa",
    "latitud": 20.5234,
    "longitud": -100.8156,
    "velocidad_kmh": 15.3,
    "ultima_actualizacion": "2026-05-22T14:35:00Z",
    "mensaje": "El camión ya se encuentra cerca de tu colonia."
  }
}
```

### Response — camión no visible (puede_ver: false)

Posibles escenarios:

```json
// Sesión sin colonia asociada
{
  "data": {
    "puede_ver": false,
    "motivo": "No hay colonia o ruta seleccionada",
    "colonia_id": null,
    "ruta_id": null,
    "recorrido_id": null,
    "camion_id": null,
    "latitud": null,
    "longitud": null,
    "velocidad_kmh": null,
    "ultima_actualizacion": null,
    "mensaje": "Selecciona tu colonia para consultar el horario y disponibilidad del camión."
  }
}
```

```json
// Camión en ruta pero fuera de la zona visible
{
  "data": {
    "puede_ver": false,
    "motivo": "El camión aún no está en zona visible para usuario anónimo",
    "colonia_id": "f9e8d7c6-b5a4-3210-9876-543210fedcba",
    "ruta_id": "11223344-5566-7788-9900-aabbccddeeff",
    "recorrido_id": "12345678-abcd-ef01-2345-678901234567",
    "camion_id": "99887766-5544-3322-1100-ffeeddccbbaa",
    "latitud": null,
    "longitud": null,
    "velocidad_kmh": null,
    "ultima_actualizacion": null,
    "mensaje": "El camión todavía no está cerca de tu colonia. Se mostrará cuando entre a la zona de servicio."
  }
}
```

```json
// Sin recorrido activo para la ruta
{
  "data": {
    "puede_ver": false,
    "motivo": "No hay recorrido activo para la ruta",
    "mensaje": "Aún no hay un camión activo para tu colonia. Consulta el horario estimado."
  }
}
```

```json
// Sesión expirada o token inválido
{
  "data": {
    "puede_ver": false,
    "motivo": "Sesión anónima no válida o expirada",
    "mensaje": "Para consultar la ubicación, selecciona nuevamente tu colonia."
  }
}
```

### Lógica de polling recomendada (Flutter)

```dart
Timer.periodic(const Duration(seconds: 30), (timer) async {
  final result = await fetchCamion(sessionToken);
  if (result['puede_ver'] == true) {
    updateMapMarker(result['latitud'], result['longitud']);
  } else {
    showStatusMessage(result['mensaje']);
  }
});
```

> **Intervalo recomendado:** 30 segundos. No más frecuente — el GPS del camión actualiza cada 30-60 segundos.

### curl

```bash
curl "http://localhost:3000/api/anonimos/camion?token=d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f"
```

---

## Endpoint 5 — Registrar evento analítico

**`POST /api/anonimos/evento`**

### Tipos de evento válidos

| tipo | Cuándo usarlo |
|------|---------------|
| `consulta_colonia` | Usuario abre la lista de colonias |
| `consulta_horario` | Usuario consulta el horario de su colonia |
| `consulta_ubicacion_camion` | Usuario abre la pantalla del camión |
| `consulta_aviso` | Usuario abre un aviso público |
| `intento_registrar_domicilio` | Usuario presiona "Guardar domicilio" (bloqueado) |
| `intento_activar_notificaciones` | Usuario presiona "Activar notificaciones" (bloqueado) |
| `conversion_a_registrado` | Usuario completa registro exitoso |

### Request — consulta normal

```json
{
  "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
  "tipo": "consulta_ubicacion_camion",
  "datos": {}
}
```

### Request — intento de función restringida

```json
{
  "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
  "tipo": "intento_registrar_domicilio",
  "datos": {
    "pantalla_origen": "mapa"
  }
}
```

### Response — 200 OK

```json
{ "ok": true }
```

### Response — 400 Bad Request (tipo inválido)

```json
{
  "ok": false,
  "error": "tipo de evento inválido",
  "details": null
}
```

### curl

```bash
# Registrar consulta
curl -X POST http://localhost:3000/api/anonimos/evento \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
    "tipo": "consulta_ubicacion_camion",
    "datos": {}
  }'

# Registrar intento de función restringida
curl -X POST http://localhost:3000/api/anonimos/evento \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f",
    "tipo": "intento_activar_notificaciones",
    "datos": {"pantalla": "configuracion"}
  }'
```

---

## Colección Postman (importar como JSON)

Guarda esto como `recolecta-anonimos.postman_collection.json`:

```json
{
  "info": {
    "name": "Recolecta Celaya — Anónimos",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:3000" },
    { "key": "session_token", "value": "d47e9c3a-1f2b-4a6d-b80e-3c7f8a2e1d5f" },
    { "key": "colonia_id", "value": "" }
  ],
  "item": [
    {
      "name": "1. Registrar sesión",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/anonimos/sesion",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"session_token\": \"{{session_token}}\",\n  \"plataforma\": \"android\",\n  \"app_version\": \"1.0.0\"\n}"
        }
      }
    },
    {
      "name": "2. Consultar permisos",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/anonimos/permisos"
      }
    },
    {
      "name": "3. Colonias y horarios",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/anonimos/colonias-horarios"
      }
    },
    {
      "name": "4. Seleccionar colonia",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/anonimos/sesion",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"session_token\": \"{{session_token}}\",\n  \"colonia_id\": \"{{colonia_id}}\"\n}"
        }
      }
    },
    {
      "name": "5. Consultar camión",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/api/anonimos/camion?token={{session_token}}",
          "query": [{ "key": "token", "value": "{{session_token}}" }]
        }
      }
    },
    {
      "name": "6. Registrar evento",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/anonimos/evento",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"session_token\": \"{{session_token}}\",\n  \"tipo\": \"consulta_ubicacion_camion\",\n  \"datos\": {}\n}"
        }
      }
    }
  ]
}
```

---

## Manejo de errores — resumen global

| Código | Situación |
|--------|-----------|
| 400 | Falta `session_token`, `tipo` inválido, JSON malformado |
| 500 | Error interno de Supabase/base de datos |

La app **no** recibirá 401 ni 403 en ningún endpoint de `/api/anonimos/*`. Estos endpoints son públicos por diseño.

---

## Notas importantes para el desarrollador móvil

1. **El `session_token` NO es secreto** — es un identificador de instalación, no un token de autenticación. Aun así, protégelo con `SecureStorage` o equivalente.
2. **La sesión expira a los 30 días** de inactividad. Llamar a `POST /sesion` con el mismo token la refresca automáticamente.
3. **Nunca envíes coordenadas GPS del usuario a estos endpoints** — no existe ningún campo para eso y el backend no lo registra en el lado anónimo.
4. **Para convertir al usuario en ciudadano registrado**, envía el evento `conversion_a_registrado` *antes* de redirigirlo al flujo de registro. Esto permite medir la tasa de conversión en el dashboard administrativo.
