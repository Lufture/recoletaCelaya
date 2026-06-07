import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { checkDisconnectedGps } from '@/lib/gps-alerts';

// GET /api/cron/gps-check
// Endpoint para verificar camiones sin señal GPS reciente.
// Protegido con la misma DEVICE_API_KEY o invocado por Vercel Cron.
export async function GET(request: NextRequest) {
  // Permitir invocación desde Vercel Cron (CRON_SECRET) o con DEVICE_API_KEY
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const deviceKey = request.headers.get('x-device-key');
  const expectedDeviceKey = process.env.DEVICE_API_KEY;

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (expectedDeviceKey && deviceKey === expectedDeviceKey);

  if (!isAuthorized) {
    return jsonError('No autorizado', 401);
  }

  try {
    const result = await checkDisconnectedGps();
    return jsonOk({
      ok: true,
      message: `Revisados ${result.checked} camiones, ${result.alertsCreated} alertas creadas.`,
      ...result,
    });
  } catch (err: any) {
    console.error('[CRON] Error en gps-check:', err);
    return jsonError('Error interno al revisar GPS', 500);
  }
}
