import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/combustible
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const camionId = request.nextUrl.searchParams.get('camionId');
  const fecha = request.nextUrl.searchParams.get('fecha');

  const supabase = await createClient();
  let query = supabase.from('consumo_combustible').select('*', { count: 'exact' });

  if (camionId) query = query.eq('camion_id', camionId);
  if (fecha) query = query.eq('fecha', fecha);

  query = query.range(offset, offset + limit - 1).order('fecha', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});

// POST /api/admin/combustible
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  if (!body.camionId) return jsonError('camionId es requerido', 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('consumo_combustible')
    .insert({
      camion_id: body.camionId,
      recorrido_id: body.recorridoId,
      fecha: body.fecha,
      litros_estimados_min: body.litrosEstimadosMin ?? 60,
      litros_estimados_max: body.litrosEstimadosMax ?? 90,
      litros_registrados: body.litrosRegistrados,
      metodo: body.metodo ?? 'estimado',
      observaciones: body.observaciones,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});
