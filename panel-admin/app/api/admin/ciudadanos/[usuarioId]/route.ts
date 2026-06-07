import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/ciudadanos/[usuarioId]
export const GET = withAuth(async (_request, context, _user) => {
  const { usuarioId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', usuarioId)
    .eq('rol', 'ciudadano')
    .single();

  if (error || !data) return jsonError('Ciudadano no encontrado', 404);

  // Fetch domicilios and dispositivos
  const [domicilios, dispositivos] = await Promise.all([
    supabase.from('domicilios_usuario').select('*, colonias(nombre), rutas(route_id, nombre)').eq('usuario_id', usuarioId),
    supabase.from('dispositivos_usuario').select('*').eq('usuario_id', usuarioId),
  ]);

  return jsonOk({
    ...data,
    domicilios: domicilios.data ?? [],
    dispositivos: dispositivos.data ?? [],
  });
});
