import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/recorridos/[recorridoId]
export const GET = withAuth(async (_request, context, _user) => {
  const { recorridoId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recorridos')
    .select('*, rutas(*), camiones(*), perfiles!recorridos_chofer_id_fkey(*)')
    .eq('id', recorridoId)
    .single();

  if (error || !data) return jsonError('Recorrido no encontrado', 404);
  return jsonOk(data);
});

// PATCH /api/admin/recorridos/[recorridoId]
export const PATCH = withAuth(async (request, context, _user) => {
  const { recorridoId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (body.estado !== undefined) updates.estado = body.estado;
  if (body.ultimoPositionId !== undefined) updates.ultimo_position_id = body.ultimoPositionId;
  if (body.fuenteGpsActiva !== undefined) updates.fuente_gps_activa = body.fuenteGpsActiva;
  if (body.salidaBaseConfirmada !== undefined) updates.salida_base_confirmada = body.salidaBaseConfirmada;
  if (body.retornoBaseConfirmado !== undefined) updates.retorno_base_confirmado = body.retornoBaseConfirmado;
  if (body.combustibleEstimadoLitros !== undefined) updates.combustible_estimado_litros = body.combustibleEstimadoLitros;

  const { data, error } = await supabase.from('recorridos').update(updates).eq('id', recorridoId).select().single();
  if (error) return jsonError(error.message, 400);
  return jsonOk(data);
});
