import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/reportes-chofer/[reporteId]
export const GET = withAuth(async (_request, context, _user) => {
  const { reporteId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase.from('reportes_chofer').select('*').eq('id', reporteId).single();
  if (error || !data) return jsonError('Reporte no encontrado', 404);
  return jsonOk(data);
});

// PATCH /api/admin/reportes-chofer/[reporteId]
export const PATCH = withAuth(async (request, context, _user) => {
  const { reporteId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (body.estado !== undefined) updates.estado = body.estado;
  if (body.requiereNotificarUsuarios !== undefined) updates.requiere_notificar_usuarios = body.requiereNotificarUsuarios;

  const { data, error } = await supabase.from('reportes_chofer').update(updates).eq('id', reporteId).select().single();
  if (error) return jsonError(error.message, 400);
  return jsonOk(data);
});
