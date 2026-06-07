import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/anonimos/sesiones
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const coloniaId = request.nextUrl.searchParams.get('coloniaId');
  const activo = request.nextUrl.searchParams.get('activo');

  const supabase = await createClient();
  let query = supabase.from('sesiones_anonimas').select('*', { count: 'exact' });

  if (coloniaId) query = query.eq('colonia_id', coloniaId);
  if (activo !== null) query = query.eq('activo', activo === 'true');

  query = query.range(offset, offset + limit - 1).order('ultimo_uso_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});
