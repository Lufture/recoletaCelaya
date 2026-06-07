import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import type { NotificacionMasivaResponse } from '@/lib/types/database';

// POST /api/admin/reportes-chofer/[reporteId]/notificar-afectados
export const POST = withAuth(async (request, context, _user) => {
  const { reporteId } = await context.params;
  const body = await request.json();
  const { titulo, mensaje } = body;

  if (!titulo || !mensaje) return jsonError('titulo y mensaje son requeridos', 400);

  // TODO: Get ruta from reporte, then call obtener_domicilios_afectados_por_ruta
  // and send push notifications

  const response: NotificacionMasivaResponse = {
    ok: true,
    usuariosObjetivo: 0,
    enviadas: 0,
    fallidas: 0,
    message: 'TODO: Implementar envío de notificaciones',
  };

  return jsonOk(response);
});
