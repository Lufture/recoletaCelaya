import { withAuth, jsonOk, jsonError, jsonSuccess } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/rutas/[rutaId]
export const GET = withAuth(async (_request, context, _user) => {
  const { rutaId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rutas')
    .select('*, ruta_posiciones(*), colonia_rutas(*, colonias(nombre))')
    .eq('id', rutaId)
    .single();

  if (error || !data) return jsonError('Ruta no encontrada', 404);
  return jsonOk(data);
});

// PATCH /api/admin/rutas/[rutaId]
export const PATCH = withAuth(async (request, context, _user) => {
  const { rutaId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (body.nombre !== undefined) updates.nombre = body.nombre;
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion;
  if (body.estado !== undefined) updates.estado = body.estado;
  if (body.colorMapa !== undefined) updates.color_mapa = body.colorMapa;
  if (body.activo !== undefined) updates.activo = body.activo;

  const { data, error } = await supabase.from('rutas').update(updates).eq('id', rutaId).select().single();
  if (error) return jsonError(error.message, 400);
  return jsonOk(data);
});

// DELETE /api/admin/rutas/[rutaId] — soft delete
export const DELETE = withAuth(async (_request, context, _user) => {
  const { rutaId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase.from('rutas').update({ activo: false }).eq('id', rutaId);
  if (error) return jsonError(error.message, 500);
  return jsonSuccess('Ruta desactivada correctamente');
});
