import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonError, jsonSuccess } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/usuarios/[usuarioId]
export const GET = withAuth(async (_request, context, _user) => {
  const { usuarioId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', usuarioId)
    .single();

  if (error || !data) return jsonError('Usuario no encontrado', 404);

  return jsonOk(data);
});

// PATCH /api/admin/usuarios/[usuarioId]
export const PATCH = withAuth(async (request, context, _user) => {
  const { usuarioId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  // Extraer camion_id si viene en el body
  const { camion_id, ...perfilData } = body;

  // Si hay password, lo actualizamos vía Admin Client
  if (perfilData.password) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();
    const { error: authError } = await adminClient.auth.admin.updateUserById(usuarioId, {
      password: perfilData.password
    });
    if (authError) return jsonError(`Error actualizando contraseña: ${authError.message}`, 400);
    
    // Lo removemos del body para que no intente guardarlo en la tabla perfiles
    delete perfilData.password;
  }

  // Update perfiles table
  const { data, error } = await supabase
    .from('perfiles')
    .update({ ...perfilData, actualizado_en: new Date().toISOString() })
    .eq('id', usuarioId)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Usuario no encontrado', 404);

  // Si el rol es chofer y viene camion_id, actualizamos la asignación
  if (perfilData.rol === 'chofer' && camion_id !== undefined) {
    // Desactivamos posibles asignaciones anteriores
    await supabase
      .from('choferes_camiones')
      .update({ activo: false })
      .eq('chofer_id', usuarioId);
      
    if (camion_id) {
      // Upsert para manejar conflict en el unique (chofer_id, camion_id)
      const { error: asignacionError } = await supabase
        .from('choferes_camiones')
        .upsert({
          chofer_id: usuarioId,
          camion_id: camion_id,
          activo: true
        }, { onConflict: 'chofer_id, camion_id' });
        
      if (asignacionError) {
        console.error('Error updating truck assignment:', asignacionError);
      }
    }
  }

  return jsonOk(data);
});

// DELETE /api/admin/usuarios/[usuarioId] — soft delete
export const DELETE = withAuth(async (_request, context, _user) => {
  const { usuarioId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('perfiles')
    .update({ activo: false })
    .eq('id', usuarioId);

  if (error) return jsonError(error.message, 500);

  return jsonSuccess('Usuario desactivado correctamente');
});
