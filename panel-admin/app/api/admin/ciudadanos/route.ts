import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/ciudadanos
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const search = request.nextUrl.searchParams.get('search');
  const coloniaId = request.nextUrl.searchParams.get('coloniaId');

  const supabase = await createClient();
  let query = supabase.from('perfiles').select('*', { count: 'exact' }).eq('rol', 'ciudadano');

  if (search) query = query.or(`nombre.ilike.%${search}%,correo.ilike.%${search}%`);
  // TODO: Filter by coloniaId via domicilios join

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});
