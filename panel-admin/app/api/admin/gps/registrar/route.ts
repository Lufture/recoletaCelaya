import { withAuth, jsonCreated, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/gps/registrar
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  const { camionId, recorridoId, fuente, latitud, longitud } = body;

  if (!camionId || !recorridoId || !fuente || latitud == null || longitud == null) {
    return jsonError('camionId, recorridoId, fuente, latitud y longitud son requeridos', 400);
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc('registrar_ingesta_gps', {
    p_camion_id: camionId,
    p_recorrido_id: recorridoId,
    p_dispositivo_id: body.dispositivoId ?? null,
    p_fuente: fuente,
    p_latitud: latitud,
    p_longitud: longitud,
    p_velocidad_kmh: body.velocidadKmh ?? null,
    p_direccion_grados: body.direccionGrados ?? null,
    p_position_id: body.positionId ?? null,
    p_timestamp_origen: null,
    p_payload_raw: body.payloadRaw ?? {},
  });

  if (error) return jsonError(error.message, 500);
  return jsonCreated({ ok: true, message: 'Ubicación registrada' });
});
