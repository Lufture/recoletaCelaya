import { type NextRequest } from 'next/server';
import { jsonCreated, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkStaticGps } from '@/lib/gps-alerts';

// POST /api/camiones/gps
// Endpoint público protegido con API Key del dispositivo (header x-device-key)
export async function POST(request: NextRequest) {
  // 1. Validar API Key del dispositivo
  const deviceKey = request.headers.get('x-device-key');
  const expectedKey = process.env.DEVICE_API_KEY;

  if (!expectedKey) {
    return jsonError('DEVICE_API_KEY no configurada en el servidor', 500);
  }

  if (!deviceKey || deviceKey !== expectedKey) {
    return jsonError('API key inválida o no proporcionada', 401);
  }

  // 2. Parsear body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError('Body JSON inválido', 400);
  }

  const {
    camionId,
    lat,
    lng,
    satellites,
    speed,
    altitude,
    fuente,
    payloadRaw,
  } = body;

  // 3. Validar campos requeridos
  if (!camionId || lat === undefined || lng === undefined) {
    return jsonError('camionId, lat y lng son requeridos', 400);
  }

  // 4. Insertar en gps_carrito usando service role (no requiere auth de usuario)
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('gps_carrito')
    .insert({
      camion_id: camionId,
      lat,
      lng,
      satellites: satellites ?? null,
      speed: speed ?? null,
      altitude: altitude ?? null,
      fuente: fuente ?? 'esp32',
      payload_raw: payloadRaw ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error('GPS Carrito Insert Error:', error);
    return jsonError(`Error al registrar ubicación: ${error.message}`, 500);
  }

  // 5. Verificar alertas GPS automáticas (no bloquea la respuesta al dispositivo)
  checkStaticGps(camionId, lat, lng).catch((err) =>
    console.error('[GPS-ALERT] Error en checkStaticGps:', err)
  );

  return jsonCreated({
    ok: true,
    message: 'Ubicación GPS registrada correctamente',
    id: data.id,
    creado_en: data.creado_en,
  });
}
