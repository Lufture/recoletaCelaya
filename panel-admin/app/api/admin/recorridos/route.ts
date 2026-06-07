import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/recorridos
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const estado = request.nextUrl.searchParams.get('estado');
  const rutaId = request.nextUrl.searchParams.get('rutaId');
  const camionId = request.nextUrl.searchParams.get('camionId');

  const supabase = await createClient();
  let query = supabase.from('recorridos').select('*', { count: 'exact' });

  if (estado) query = query.eq('estado', estado);
  if (rutaId) query = query.eq('ruta_id', rutaId);
  if (camionId) query = query.eq('camion_id', camionId);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});

// POST /api/admin/recorridos
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  if (!body.rutaId || !body.camionId || !body.choferId) {
    return jsonError('rutaId, camionId y choferId son requeridos', 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recorridos')
    .insert({
      ruta_id: body.rutaId,
      camion_id: body.camionId,
      chofer_id: body.choferId,
      kilometraje_inicio: body.kilometrajeInicio,
      estado: 'en_ruta',
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});
