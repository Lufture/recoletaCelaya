import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import type { NotificacionMasivaResponse } from '@/lib/types/database';

// POST /api/admin/notificaciones/enviar-general
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  const { titulo, mensaje } = body;

  if (!titulo || !mensaje) return jsonError('titulo y mensaje son requeridos', 400);

  // TODO: Query domicilios afectados, send push notifications
  // Filter by coloniaId/rutaId if provided

  const response: NotificacionMasivaResponse = {
    ok: true,
    usuariosObjetivo: 0,
    enviadas: 0,
    fallidas: 0,
    message: 'TODO: Implementar envío masivo de notificaciones',
  };

  return jsonOk(response);
});
