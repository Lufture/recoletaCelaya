import { withAuth, jsonSuccess, jsonError } from '@/lib/api-helpers';

// POST /api/admin/usuarios/[usuarioId]/reset-password
export const POST = withAuth(async (request, context, _user) => {
  const { usuarioId } = await context.params;
  const body = await request.json().catch(() => ({}));

  // TODO: Use createAdminClient() to reset password or send email
  // const { enviarCorreo, passwordTemporal } = body;

  return jsonSuccess('Restablecimiento procesado');
});
