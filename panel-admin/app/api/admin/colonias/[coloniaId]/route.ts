import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonError, jsonSuccess } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/colonias/[coloniaId]
export const GET = withAuth(async (_request, context, _user) => {
  const { coloniaId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('colonias')
    .select('*')
    .eq('id', coloniaId)
    .single();

  if (error || !data) return jsonError('Colonia no encontrada', 404);

  return jsonOk(data);
});

// PATCH /api/admin/colonias/[coloniaId]
export const PATCH = withAuth(async (request, context, _user) => {
  const { coloniaId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  // Clean data
  const updateData: any = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.latitud !== undefined) updateData.latitud = body.latitud !== null ? Number(body.latitud) : null;
  if (body.longitud !== undefined) updateData.longitud = body.longitud !== null ? Number(body.longitud) : null;
  if (body.activa !== undefined) updateData.activa = body.activa;
  
  if (Object.keys(updateData).length > 0) {
    updateData.actualizado_en = new Date().toISOString();
  } else {
    return jsonError('No hay datos para actualizar', 400);
  }

  const { data, error } = await supabase
    .from('colonias')
    .update(updateData)
    .eq('id', coloniaId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique violation
      return jsonError('Ya existe una colonia con ese nombre', 400);
    }
    return jsonError(error.message, 400);
  }
  
  if (!data) return jsonError('Colonia no encontrada', 404);

  return jsonOk(data);
});

// DELETE /api/admin/colonias/[coloniaId]
// Realizamos un soft delete para no afectar recorridos históricos
export const DELETE = withAuth(async (_request, context, _user) => {
  const { coloniaId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('colonias')
    .update({ activa: false, actualizado_en: new Date().toISOString() })
    .eq('id', coloniaId);

  if (error) return jsonError(error.message, 500);

  return jsonSuccess('Colonia desactivada correctamente');
});
