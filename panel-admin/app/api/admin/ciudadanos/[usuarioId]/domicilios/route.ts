import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/ciudadanos/[usuarioId]/domicilios
export const GET = withAuth(async (_request, context, _user) => {
  const { usuarioId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('domicilios_usuario')
    .select('*, colonias(nombre), rutas(route_id, nombre)')
    .eq('usuario_id', usuarioId);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [] });
});
