import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

const TIPOS_PERMITIDOS = new Set([
  'consulta_colonia',
  'consulta_horario',
  'consulta_ubicacion_camion',
  'consulta_aviso',
  'intento_registrar_domicilio',
  'intento_activar_notificaciones',
  'conversion_a_registrado',
]);

// POST /api/anonimos/evento
// Registra un evento analítico del usuario anónimo. Si el tipo es uno de los
// "intento_*" sirve también como señal de que el usuario quiso usar una
// función restringida (registrar domicilio / activar notificaciones).
export async function POST(request: NextRequest) {
  let body: { session_token?: string; tipo?: string; datos?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  const sessionToken = body.session_token?.trim();
  const tipo = body.tipo?.trim();

  if (!sessionToken) return jsonError('session_token es requerido', 400);
  if (!tipo || !TIPOS_PERMITIDOS.has(tipo)) return jsonError('tipo de evento inválido', 400);

  const supabase = createAdminClient();
  const { error } = await supabase.rpc('registrar_evento_anonimo', {
    p_session_token: sessionToken,
    p_tipo: tipo,
    p_datos: body.datos ?? {},
  });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ ok: true });
}
