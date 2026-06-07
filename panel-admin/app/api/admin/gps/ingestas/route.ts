import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/gps/ingestas
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const camionId = request.nextUrl.searchParams.get('camionId');
  const recorridoId = request.nextUrl.searchParams.get('recorridoId');
  const fuente = request.nextUrl.searchParams.get('fuente');

  const supabase = await createClient();
  let query = supabase.from('gps_ingestas').select('*', { count: 'exact' });

  if (camionId) query = query.eq('camion_id', camionId);
  if (recorridoId) query = query.eq('recorrido_id', recorridoId);
  if (fuente) query = query.eq('fuente', fuente);

  query = query.range(offset, offset + limit - 1).order('recibido_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});
