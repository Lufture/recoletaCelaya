import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/gps-carrito/[camionId]
// Historial paginado de posiciones GPS de un carrito/camión específico.
// Parámetros opcionales:
//   desde  ISO 8601 — limita por fecha de inicio
//   hasta  ISO 8601 — limita por fecha de fin
//   page / limit (default limit=100)
export const GET = withAuth(async (request: NextRequest, context, _user) => {
  const { camionId } = await context.params;
  const sp = request.nextUrl.searchParams;
  const desde = sp.get('desde');
  const hasta = sp.get('hasta');
  const { page, limit, offset } = getPaginationParams(request);

  const supabase = createAdminClient();
  let query = supabase
    .from('gps_carrito')
    .select('id, lat, lng, speed, altitude, satellites, fuente, creado_en', { count: 'exact' })
    .eq('camion_id', camionId)
    .order('creado_en', { ascending: true }); // ascendente para trail

  if (desde) query = query.gte('creado_en', desde);
  if (hasta) query = query.lte('creado_en', hasta);

  query = query.range(offset, offset + limit - 1);
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({
    camion_id: camionId,
    data: data ?? [],
    pagination: buildPagination(page, limit, count ?? 0),
  });
});
