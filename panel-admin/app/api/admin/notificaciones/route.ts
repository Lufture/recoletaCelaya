import { withAuth, jsonOk, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/notificaciones
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const usuarioId = request.nextUrl.searchParams.get('usuarioId');
  const evento = request.nextUrl.searchParams.get('evento');
  const enviado = request.nextUrl.searchParams.get('enviado');

  const supabase = await createClient();
  let query = supabase.from('notificaciones_enviadas').select('*', { count: 'exact' });

  if (usuarioId) query = query.eq('usuario_id', usuarioId);
  if (evento) query = query.eq('evento', evento);
  if (enviado !== null) query = query.eq('enviado', enviado === 'true');

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});
