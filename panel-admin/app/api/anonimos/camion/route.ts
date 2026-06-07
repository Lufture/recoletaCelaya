import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/anonimos/camion?token=...
// Consulta limitada: sólo devuelve la ubicación del camión si está en
// punto de proximidad de la colonia seleccionada por el usuario anónimo.
// Toda la lógica de visibilidad vive en la función SQL obtener_camion_para_anonimo.
export async function GET(request: NextRequest) {
  const sessionToken = request.nextUrl.searchParams.get('token');
  if (!sessionToken) {
    return jsonError('token es requerido', 400);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('obtener_camion_para_anonimo', {
    p_session_token: sessionToken,
  });

  if (error) return jsonError(error.message, 500);

  // La función devuelve una sola fila (returns table).
  const row = Array.isArray(data) ? data[0] ?? null : data ?? null;
  return jsonOk({ data: row });
}
