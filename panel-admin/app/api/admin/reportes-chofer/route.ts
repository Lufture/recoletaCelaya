import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/reportes-chofer
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const estado = request.nextUrl.searchParams.get('estado');
  const tipo = request.nextUrl.searchParams.get('tipo');
  const recorridoId = request.nextUrl.searchParams.get('recorridoId');

  const supabase = await createClient();
  let query = supabase.from('reportes_chofer').select('*', { count: 'exact' });

  if (estado) query = query.eq('estado', estado);
  if (tipo) query = query.eq('tipo', tipo);
  if (recorridoId) query = query.eq('recorrido_id', recorridoId);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});
