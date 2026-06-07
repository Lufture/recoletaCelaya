import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/anonimos/eventos
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const tipo = request.nextUrl.searchParams.get('tipo');
  const coloniaId = request.nextUrl.searchParams.get('coloniaId');

  const supabase = await createClient();
  let query = supabase.from('eventos_anonimos').select('*', { count: 'exact' });

  if (tipo) query = query.eq('tipo', tipo);
  if (coloniaId) query = query.eq('colonia_id', coloniaId);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});
