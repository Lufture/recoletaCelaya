import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/anonimos/permisos
// Devuelve la matriz de permisos por modo de usuario (anonimo vs registrado).
// Pensada para que el cliente móvil oculte/muestre funciones.
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('vista_permisos_modo_usuario')
    .select('*');

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [] });
}
