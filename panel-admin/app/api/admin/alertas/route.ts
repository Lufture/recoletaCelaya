import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/alertas
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const estado = request.nextUrl.searchParams.get('estado');
  const tipo = request.nextUrl.searchParams.get('tipo');

  const supabase = await createClient();
  let query = supabase.from('alertas_admin').select('*', { count: 'exact' });

  if (estado) query = query.eq('estado', estado);
  if (tipo) query = query.eq('tipo', tipo);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});

// POST /api/admin/alertas
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  if (!body.tipo || !body.titulo || !body.mensaje) {
    return jsonError('tipo, titulo y mensaje son requeridos', 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('crear_alerta_admin', {
    p_tipo: body.tipo,
    p_titulo: body.titulo,
    p_mensaje: body.mensaje,
    p_camion_id: body.camionId ?? null,
    p_recorrido_id: body.recorridoId ?? null,
    p_chofer_id: body.choferId ?? null,
    p_dispositivo_id: null,
    p_latitud: body.latitud ?? null,
    p_longitud: body.longitud ?? null,
    p_datos: body.datos ?? {},
  });

  if (error) return jsonError(error.message, 500);
  return jsonCreated({ id: data, ok: true });
});
