# Documentación de implementación — Panel Admin HackOnLinces

> **Proyecto:** Panel administrativo para sistema de recolección de basura en Celaya, Gto.  
> **Stack:** Next.js (App Router) · Supabase (PostgreSQL + RLS) · Leaflet · Tailwind CSS  
> **Fecha de implementación:** Mayo 2026

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Corrección del mapa GPS](#2-corrección-del-mapa-gps)
3. [Hook useGpsCarrito](#3-hook-usegpscarrito)
4. [Componente MapaLeaflet](#4-componente-mapaleaflet)
5. [MiniMapa por ruta](#5-minimapa-por-ruta)
6. [Tabla de actividad GPS](#6-tabla-de-actividad-gps)
7. [Página /admin/rutas](#7-página-adminrutas)
8. [Seeds de base de datos](#8-seeds-de-base-de-datos)
9. [Correcciones de encoding en Colonias](#9-correcciones-de-encoding-en-colonias)
10. [Colonias en panel de detalle de ruta](#10-colonias-en-panel-de-detalle-de-ruta)
11. [Endpoint CSV de reportes](#11-endpoint-csv-de-reportes)
12. [Página /admin/reportes](#12-página-adminreportes)
13. [Verificaciones y consistencia](#13-verificaciones-y-consistencia)
14. [Restricciones aplicadas](#14-restricciones-aplicadas)
15. [Resultado final: TypeScript](#15-resultado-final-typescript)

---

## 1. Arquitectura general

### Fuente GPS
Toda la localización proviene de la tabla `public.gps_carrito`. Esta tabla **no está publicada en Supabase Realtime** y tiene RLS que bloquea lecturas directas desde el cliente anónimo/autenticado. La solución adoptada es un endpoint API que usa `createAdminClient()` (service role) para bypasear RLS.

```
gps_carrito (Supabase)
      │
      └─► /api/admin/gps-carrito   (createAdminClient, server-side)
                │
                ├─► useGpsCarrito (hook)      → MapaLeaflet (dashboard)
                └─► fetch directo             → MiniMapaLeaflet (rutas)
                                              → GpsCarritoTable (auditoría)
```

### RLS y acceso a datos
| Tabla | Cliente usado | Motivo |
|---|---|---|
| `gps_carrito` | `createAdminClient` (API) | Sin políticas públicas de lectura |
| `colonias` | `createClient` (server) | Política admin + política pública |
| `colonia_rutas` | `createClient` (server) | `public_select_colonia_rutas` (activo=true) |
| `rutas` | `createClient` (server) | Política admin |
| `reportes_*` | `createAdminClient` (API) | Acceso admin completo |

---

## 2. Corrección del mapa GPS

**Problema raíz:** `createClient()` (anon/authenticated key) retornaba `[]` silenciosamente para `gps_carrito` debido a RLS sin política pública de lectura.

**Solución:** Todas las lecturas de `gps_carrito` pasan por `/api/admin/gps-carrito` que usa `createAdminClient()`.

### Archivo: `app/api/admin/gps-carrito/route.ts`
Endpoint existente que ya usaba `createAdminClient`. No se modificó.

**Parámetros soportados:**
- Sin params → última posición por `camion_id`
- `?todos=true` → historial completo
- `?todos=true&camionId=UUID` → historial de un camión específico
- `?todos=true&desde=ISO` → filtro temporal
- `?todos=true&limit=N` → límite de filas

---

## 3. Hook useGpsCarrito

**Archivo:** `hooks/useGpsCarrito.ts`

Reescrito para consumir la API en vez de Supabase directamente.

```typescript
// Antes (fallaba por RLS):
supabase.from('gps_carrito').select('*')

// Después (bypasea RLS):
fetch('/api/admin/gps-carrito', { credentials: 'same-origin' })
```

**Comportamiento:**
- Polling cada 30 s con `setInterval`
- Estado exportado: `{ ubicaciones: UbicacionActual[], status: GpsConnectionStatus }`
- `status`: `'connecting' | 'connected' | 'error'`
- Debug log con `[useGpsCarrito]` prefix (para quitar en producción)

---

## 4. Componente MapaLeaflet

**Archivo:** `components/admin/mapa/MapaLeaflet.tsx`

Mapa principal del dashboard. **No se modificó la lógica GPS original.** Cambios realizados:

### Trail de rutas (polilíneas)
```typescript
// Intento 1: últimas 6 horas
GET /api/admin/gps-carrito?todos=true&desde=ISO&limit=500

// Fallback (si intento 1 devuelve 0 filas):
GET /api/admin/gps-carrito?todos=true&limit=500
```

### Estado de datos del mapa
```typescript
type MapDataStatus = 'none' | 'stale' | 'live'
```
- `none` → badge "Sin datos GPS disponibles"
- `stale` → badge ámbar "Mostrando último recorrido registrado"
- `live` → sin badge (datos recientes)

### Badges de estado
Tres overlays en la parte superior del mapa según `status` (del hook) y `mapDataStatus` (del trail):
- Rojo: sin conexión GPS
- Ámbar: cargando / datos históricos
- Transparente: sin datos
- Sin badge: operación normal

---

## 5. MiniMapa por ruta

**Archivos:**
- `components/admin/mapa/MiniMapaLeaflet.tsx` — implementación Leaflet
- `components/admin/mapa/MiniMapaClient.tsx` — wrapper con `dynamic(ssr: false)`

### Props
```typescript
interface Props {
  camionId?: string | null;  // UUID del camión. null/undefined → todos
}
```

### Estados internos
| Estado | Descripción | UI |
|---|---|---|
| `loading` | Primera carga | Spinner centrado |
| `empty` | Sin datos GPS | Overlay gris "No hay datos GPS…" |
| `stale` | Datos fuera de ventana de 6 h | Banner ámbar en la parte inferior |
| `live` | Datos recientes | Mapa limpio |

### Fallback automático
```
Intento 1: ?todos=true&camionId=UUID&desde=ISO (últimas 6 h)
    │
    └─ 0 rows → Intento 2: ?todos=true&camionId=UUID (sin filtro temporal)
                    → usedFallback = true → dataState = 'stale'
```

### `fitBounds`
Se ejecuta **una sola vez** por `camionId` (ref `hasFitBounds`). Se resetea cuando cambia `camionId`.

### Marcador de posición
- Dot colorido = señal reciente (< 5 min)
- Dot gris `#94a3b8` = señal antigua (> 5 min)
- Popup: velocidad + hora + aviso de sin señal si aplica

---

## 6. Tabla de actividad GPS

**Archivo:** `components/admin/gps/GpsCarritoTable.tsx`

Componente de auditoría para ver los últimos registros de `gps_carrito`.

### Características
- Consume `GET /api/admin/gps-carrito?todos=true&limit=15`
- Auto-refresco cada 15 s + botón "Actualizar" manual
- Altura máxima: `max-h-[420px] overflow-y-auto` (no desborda el layout)
- Tabla interna: `min-w-[900px]` para 9 columnas sin romper el layout padre

### Columnas
| Carrito | Camion ID | Latitud | Longitud | Velocidad | Satélites | Fuente | Fecha | Estado |
|---|---|---|---|---|---|---|---|---|

### Cálculo de estado (frontend)
```typescript
function calcEstado(creado_en: string) {
  const diff = Date.now() - new Date(creado_en).getTime();
  if (diff < 5 * 60 * 1000)  return { label: 'En vivo',   badgeClass: 'badge-green'  };
  if (diff < 60 * 60 * 1000) return { label: 'Reciente',  badgeClass: 'badge-blue'   };
  return                             { label: 'Histórico', badgeClass: 'badge-slate'  };
}
```

---

## 7. Página /admin/rutas

**Archivo:** `app/admin/rutas/page.tsx`

Página client-side (`'use client'`) con layout de dos paneles.

### Layout
```
grid grid-cols-1 xl:grid-cols-[1fr_420px]
xl:h-[calc(100vh-var(--topbar-height))]
-mx-8 -my-6
```

**Panel izquierdo** (`min-h-0 flex flex-col overflow-y-auto`):
- Sección 1: tabla de rutas demo (seleccionable al hacer clic en fila)
- Sección 2: `<GpsCarritoTable />` (separada con `space-y-8`)

**Panel derecho** (`min-h-0 overflow-y-auto`):
- Sin selección: ícono + mensaje de ayuda
- Con selección: tabs + banner de estado + grid de detalles + mini mapa + **colonias** + acciones

### Tipo `RutaDemo`
```typescript
interface RutaDemo {
  id: string;           // display: 'RT-001'
  zona: string;
  estado: string;
  estadoColor: 'green' | 'gray' | 'blue' | 'orange' | 'red';
  progreso: number;
  camion_id: string | null;   // UUID del camión (para MiniMapa)
  ruta_uuid: string | null;   // UUID de la ruta en BD (para colonias)
  horario: string;
  paradas: number;
  distancia: string;
  frecuencia: string;
  vehiculos: string[];
}
```

### Datos demo — correspondencia con seeds
| Frontend `id` | `ruta_uuid` (BD) | `camion_id` (BD) |
|---|---|---|
| `RT-001` | `31000000-…0001` | `00000000-…0001` |
| `RT-002` | `null` | `null` |
| `RT-003` | `31000000-…0003` | `00000000-…0002` |
| `RT-004` | `null` | `null` |
| `RT-005` | `null` | `null` |

---

## 8. Seeds de base de datos

### `db/seeds/gps_carrito_demo.sql`
_(Pre-existente)_  
20 puntos GPS por camión, 2 camiones:
- `00000000-0000-0000-0000-000000000001` — ruta por el Centro
- `00000000-0000-0000-0000-000000000002` — ruta por el Sur

### `db/seeds/colonias_celaya_demo.sql` _(nuevo)_
15 colonias reales de Celaya con coordenadas aproximadas. IDs fijos para poder referenciarlos.

| ID | Colonia |
|---|---|
| `20000000-…0001` | Centro Histórico |
| `20000000-…0002` | Jardines del Moral |
| `20000000-…0003` | Fracc. Arboledas |
| `20000000-…0004` | Colonia Álamos |
| `20000000-…0005` | San Cayetano |
| `20000000-…0006` | El Vergel |
| `20000000-…0007` | La Joya |
| `20000000-…0008` | Fracc. Las Flores |
| `20000000-…0009` | Colonia Industrial |
| `20000000-…000a` | Barrio del Zapote |
| `20000000-…000b` | Colonia Obrera |
| `20000000-…000c` | Las Torres |
| `20000000-…000d` | San Isidro |
| `20000000-…000e` | El Pueblito |
| `20000000-…000f` | Lomas de Celaya |

**Columnas insertadas:** `id, nombre, descripcion, latitud, longitud, activa`

### `db/seeds/rutas_colonias_demo.sql` _(nuevo)_
Inserta 2 rutas en `public.rutas` y vincula 7 colonias a cada una en `public.colonia_rutas`.

```sql
-- Rutas
('31000000-…0001', 'RT-001', 'Centro Histórico', ...)
('31000000-…0003', 'RT-003', 'Sur - Arboledas', ...)

-- Pivote colonia_rutas: 7 filas por ruta con horario_estimado,
-- hora_inicio_estimada, hora_fin_estimada
```

**Importante:** `on conflict (id) do update set route_id = excluded.route_id, ...`  
→ Corrige automáticamente cualquier versión antigua con `route_id = 'RUTA-01'`.

#### Correspondencia de identificadores
| Capa | Identificador visible | UUID |
|---|---|---|
| BD `rutas.route_id` | `RT-001` | `31000000-…0001` |
| Frontend `RUTAS_DEMO.id` | `RT-001` | _(display only)_ |
| Frontend `RUTAS_DEMO.ruta_uuid` | _(interno)_ | `31000000-…0001` |

**Un único identificador visible `RT-001`** entre BD y frontend.

#### Orden de ejecución
```
1. bd_completa.sql (schema)
2. colonias_celaya_demo.sql
3. rutas_colonias_demo.sql
4. gps_carrito_demo.sql
```

---

## 9. Correcciones de encoding en Colonias

**Archivo:** `components/admin/ColoniasClient.tsx`

El archivo tenía caracteres UTF-8 corruptos por una lectura incorrecta del encoding. Correcciones aplicadas:

| Antes (corrupto) | Después (correcto) |
|---|---|
| `` `A$A{currentState ? 'A$Desactivar' : 'A$Activar'}` `` | `` `${currentState ? 'Desactivar' : 'Activar'}` `` |
| `GestiA3n del catA1logo de colonias para rutas y recolecciA3n.` | `Gestión del catálogo de colonias para rutas y recolección.` |
| `bAosqueda` | `búsqueda` |
| `PA1gina` | `Página` |

**Archivo:** `app/api/admin/colonias/[coloniaId]/route.ts`

| Antes | Después |
|---|---|
| `histA3ricos` (en comentario) | `históricos` |

---

## 10. Colonias en panel de detalle de ruta

**Archivo:** `app/admin/rutas/page.tsx`

Al seleccionar una ruta con `ruta_uuid` definido, el panel derecho muestra las colonias vinculadas.

### Fetch
```typescript
useEffect(() => {
  if (!selectedRuta?.ruta_uuid) { setColonias([]); return; }
  fetch(`/api/admin/rutas/${selectedRuta.ruta_uuid}/colonias`)
    .then(r => r.json())
    .then(json => setColonias(json.data ?? []));
}, [selectedRuta?.ruta_uuid]);
```

### API utilizada
```
GET /api/admin/rutas/[rutaId]/colonias
→ colonia_rutas JOIN colonias(nombre) WHERE ruta_id = rutaId
```

### UI
- Sección "Colonias de esta ruta" con ícono `<MapPin>`
- Loading spinner mientras carga
- Lista de pills: `nombre` a la izquierda + `HH:MM–HH:MM` a la derecha
- Mensaje "Sin colonias registradas." si la BD no tiene datos

### Tabla pivote
```
bd_completa.sql:181
create table if not exists public.colonia_rutas (
  id uuid primary key,
  colonia_id uuid references public.colonias(id),
  ruta_id    uuid references public.rutas(id),
  horario_estimado     text,
  hora_inicio_estimada time,
  hora_fin_estimada    time,
  activo boolean default true,
  ...
)
```

### RLS sobre colonia_rutas
```sql
-- Lectura pública (filas activas):
"public_select_colonia_rutas"  FOR SELECT  USING (activo = true)

-- Admin (todo):
"admin_gestiona_colonia_rutas" FOR ALL  USING (obtener_rol_usuario() = 'admin')
```
No requiere `createAdminClient()` — `createClient()` con sesión admin es suficiente.

---

## 11. Endpoint CSV de reportes

**Archivo:** `app/api/admin/reportes/route.ts`

```
GET /api/admin/reportes?tipo=X&formato=csv
GET /api/admin/reportes?tipo=X&formato=json
```

### Tipos soportados

| `tipo` | Fuente | Límite | Archivo |
|---|---|---|---|
| `colonias` | tabla `colonias` | sin límite | `colonias.csv` |
| `rutas` | `rutas` + `colonia_rutas` + `recorridos` | sin límite | `rutas.csv` |
| `reportes_ciudadanos` | tabla `reportes_ciudadanos` | 1 000 | `reportes_ciudadanos.csv` |
| `reportes_chofer` | tabla `reportes_chofer` | 1 000 | `reportes_chofer.csv` |
| `gps_carrito` | tabla `gps_carrito` | 500 | `gps_carrito.csv` |

### Columnas por tipo

**colonias:**
`ID, Nombre, Descripción, Latitud, Longitud, Activa, Creado en`

**rutas:**
`ID Ruta, Nombre / Zona, Estado, Activa, Colonias asociadas, Cantidad de colonias, Vehículos asignados`
- Colonias: join anidado `colonia_rutas(activo, colonias(nombre))`, filtradas por `activo = true`, concatenadas con `, `
- Vehículos: recorridos activos (`en_ruta | pausado | programado`) → `camiones(clave)`, dedupados por ruta
- Progreso: no existe en BD → columna omitida

**reportes_ciudadanos:**
`ID, Tipo, Estado, Descripción, Colonia, Creado en`

**reportes_chofer:**
`ID, Tipo, Título, Descripción, Estado, Latitud, Longitud, Creado en`

**gps_carrito:**
`ID, Camión ID, Latitud, Longitud, Velocidad (km/h), Fuente, Creado en`

### UTF-8 y compatibilidad con Excel
```typescript
const csv = '﻿' + csvLines.join('\r\n'); // BOM al inicio
// Content-Type: text/csv; charset=utf-8
// Content-Disposition: attachment; filename="X.csv"
// Cache-Control: no-store
```
El BOM (`﻿`) asegura que Excel abra el CSV con encoding correcto sin pedir configuración.

### Serialización
```typescript
const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
// Todos los valores van entre comillas dobles (RFC 4180)
// Las comillas internas se duplican: " → ""
```

### Cliente Supabase
Usa `createAdminClient()` para bypasear RLS en todas las tablas.

---

## 12. Página /admin/reportes

**Archivo:** `app/admin/reportes/page.tsx`

Página client-side con 5 tarjetas de descarga.

### Tarjetas (en orden)
1. **Colonias** — ícono `MapPin` (emerald)
2. **Rutas** — ícono `Route` (blue)
3. **Reportes ciudadanos** — ícono `FileText` (blue)
4. **Reportes de chofer** — ícono `Truck` (orange)
5. **Actividad GPS** — ícono `Navigation` (purple)

### Mecanismo de descarga
```typescript
fetch(`/api/admin/reportes?tipo=${tipo}&formato=csv`)
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  });
```
- Sin redirección ni apertura de nueva pestaña
- Loading spinner por tarjeta (estado independiente)
- Alert de error si el endpoint falla

---

## 13. Verificaciones y consistencia

### Cadena completa RT-001
```
RUTAS_DEMO.id = 'RT-001'           (display)
RUTAS_DEMO.ruta_uuid               = '31000000-0000-0000-0000-000000000001'
rutas.route_id (BD)                = 'RT-001'                 ← mismo valor visible
rutas.id (BD)                      = '31000000-…0001'
colonia_rutas.ruta_id (BD)         = '31000000-…0001'   × 7 filas
colonias.id (BD)                   = '20000000-…0001' … '20000000-…000c'
/api/admin/rutas/31000000-…0001/colonias → 7 colonias ✓
```

### RLS de tablas relevantes
| Tabla | SELECT | Usado en |
|---|---|---|
| `gps_carrito` | Sin política pública → solo service role | `/api/admin/gps-carrito` |
| `colonias` | Política pública o admin | `/api/admin/colonias` |
| `colonia_rutas` | `activo = true` (público) + admin (todo) | `/api/admin/rutas/[id]/colonias` |
| `rutas` | Solo admin | `/api/admin/reportes` (service role) |
| `reportes_chofer` | Solo admin | `/api/admin/reportes` (service role) |

---

## 14. Restricciones aplicadas

Durante toda la implementación se respetaron las siguientes restricciones explícitas del equipo:

- ✅ No se tocó el dashboard principal (`app/admin/dashboard/`)
- ✅ No se modificó `MapaLeaflet.tsx` más allá de lo acordado (trail + badges)
- ✅ No se modificó `useGpsCarrito.ts` más allá de lo acordado (API fetch)
- ✅ No se tocaron los endpoints de `gps_carrito` que ya funcionaban
- ✅ No se modificó la autenticación
- ✅ No se hicieron refactors grandes
- ✅ No se cambiaron nombres de tablas ni columnas existentes en BD
- ✅ No se inventó estructura sin revisar primero `bd_completa.sql`

---

## 15. Resultado final: TypeScript

```bash
npx tsc --noEmit
# Exit code: 0  (cero errores)
```

---

## Archivos creados o modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `hooks/useGpsCarrito.ts` | Modificado | API fetch en lugar de Supabase directo |
| `components/admin/mapa/MapaLeaflet.tsx` | Modificado | Trail + fallback + badges de estado |
| `components/admin/mapa/MiniMapaLeaflet.tsx` | Reescrito | MiniMapa con prop camionId, fallback, overlays |
| `components/admin/mapa/MiniMapaClient.tsx` | Modificado | Prop forwarding camionId |
| `components/admin/gps/GpsCarritoTable.tsx` | Creado | Tabla de auditoría GPS (15 registros, auto-refresh) |
| `components/admin/ColoniasClient.tsx` | Modificado | Corrección de 4 errores de encoding |
| `app/admin/rutas/page.tsx` | Reescrito | Grid layout + MiniMapa + colonias sidebar + GpsCarritoTable |
| `app/admin/reportes/page.tsx` | Creado | 5 tarjetas de descarga CSV |
| `app/api/admin/reportes/route.ts` | Creado | Endpoint CSV para 5 tipos de reportes |
| `app/api/admin/colonias/[coloniaId]/route.ts` | Modificado | Corrección encoding en comentario |
| `db/seeds/colonias_celaya_demo.sql` | Creado | 15 colonias de Celaya con coordenadas |
| `db/seeds/rutas_colonias_demo.sql` | Creado | 2 rutas + 14 vínculos en colonia_rutas |
