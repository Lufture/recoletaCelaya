import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/anonimos/sesion
// Registra o actualiza una sesión anónima. El cliente móvil envía un token
// generado en el dispositivo y opcionalmente la colonia seleccionada.
// Restricción explícita: el modo anónimo NO permite registrar colonia ni domicilio.
export async function POST(request: NextRequest) {
  let body: {
    session_token?: string;
    colonia_id?: string | null;
    plataforma?: string | null;
    app_version?: string | null;
    modelo_dispositivo?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  const sessionToken = body.session_token?.trim();
  if (!sessionToken) {
    return jsonError('session_token es requerido', 400);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('registrar_sesion_anonima', {
    p_session_token: sessionToken,
    p_colonia_id: body.colonia_id ?? null,
    p_plataforma: body.plataforma ?? null,
    p_app_version: body.app_version ?? null,
    p_modelo_dispositivo: body.modelo_dispositivo ?? null,
  });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ sesion_id: data });
}
