import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/alertas/[alertaId]
export const GET = withAuth(async (_request, context, _user) => {
  const { alertaId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase.from('alertas_admin').select('*').eq('id', alertaId).single();
  if (error || !data) return jsonError('Alerta no encontrada', 404);
  return jsonOk(data);
});

// PATCH /api/admin/alertas/[alertaId]
export const PATCH = withAuth(async (request, context, user) => {
  const { alertaId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('alertas_admin')
    .update({ estado: body.estado, atendido_por: user.id })
    .eq('id', alertaId)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonOk(data);
});
