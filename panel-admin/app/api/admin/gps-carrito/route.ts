import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// ── GET /api/admin/gps-carrito ─────────────────────────────────────────────
// Parámetros opcionales:
//   camionId    UUID — filtra por camion; si se omite devuelve la última
//               posición de cada camion (deduplica en JS).
//   desde       ISO 8601 — limita el historial por fecha de inicio.
//   hasta       ISO 8601 — limita el historial por fecha de fin.
//   todos=true  Devuelve todos los registros sin deduplicar (para trail).
//   page / limit — paginación estándar (sólo cuando camionId o todos=true).
//
// NOTA: gps_carrito.camion_id es nullable; registros con camion_id=null
//       se agrupan bajo la clave virtual "__sin_camion__" en la respuesta.
// ──────────────────────────────────────────────────────────────────────────

export const GET = withAuth(async (request, _context, _user) => {
  const sp = request.nextUrl.searchParams;
  const camionId = sp.get('camionId');
  const desde = sp.get('desde');
  const hasta = sp.get('hasta');
  const todos = sp.get('todos') === 'true';
  const { page, limit, offset } = getPaginationParams(request);

  const supabase = createAdminClient();

  let query = supabase
    .from('gps_carrito')
    .select('id, lat, lng, speed, altitude, satellites, camion_id, fuente, creado_en', { count: 'exact' })
    .order('creado_en', { ascending: false });

  if (camionId) query = query.eq('camion_id', camionId);
  if (desde)    query = query.gte('creado_en', desde);
  if (hasta)    query = query.lte('creado_en', hasta);

  // Si se pide trail completo o historial de un camión específico → paginamos
  if (todos || camionId) {
    query = query.range(offset, offset + limit - 1);
    const { data, count, error } = await query;
    if (error) return jsonError(error.message, 500);
    return jsonOk({
      data: data ?? [],
      pagination: buildPagination(page, limit, count ?? 0),
    });
  }

  // Default: última posición por camion_id (máx. 200 registros en memoria)
  query = query.limit(200);
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  const rows = data ?? [];
  const seen = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const key = row.camion_id ?? '__sin_camion__';
    if (!seen.has(key)) seen.set(key, row);
  }

  return jsonOk({ data: Array.from(seen.values()) });
});

// ── POST /api/admin/gps-carrito ───────────────────────────────────────────
// Inserta una posición GPS directamente desde el panel admin.
// Útil para inyectar datos de demo sin necesitar la device key del ESP32.
// ──────────────────────────────────────────────────────────────────────────

export const POST = withAuth(async (request, _context, _user) => {
  let body: {
    camionId?: string | null;
    lat?: number;
    lng?: number;
    speed?: number | null;
    altitude?: number | null;
    satellites?: number | null;
    fuente?: string;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  if (body.lat === undefined || body.lng === undefined) {
    return jsonError('lat y lng son requeridos', 400);
  }
  if (Math.abs(body.lat) > 90 || Math.abs(body.lng) > 180) {
    return jsonError('lat o lng fuera de rango', 400);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('gps_carrito')
    .insert({
      camion_id: body.camionId ?? null,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? null,
      altitude: body.altitude ?? null,
      satellites: body.satellites ?? null,
      fuente: body.fuente ?? 'admin_panel',
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonCreated({ ok: true, id: data.id, creado_en: data.creado_en });
});
