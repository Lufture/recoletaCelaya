import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/combustible/estimar/[recorridoId]
export const GET = withAuth(async (_request, context, _user) => {
  const { recorridoId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('estimar_consumo_recorrido', {
    p_recorrido_id: recorridoId,
  });

  if (error) return jsonError(error.message, 500);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return jsonError('Recorrido no encontrado', 404);

  return jsonOk({
    recorridoId: row.recorrido_id,
    camionId: row.camion_id,
    litrosEstimadosMin: row.litros_estimados_min,
    litrosEstimadosMax: row.litros_estimados_max,
    observacion: row.observacion,
  });
});
