import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/anonimos/colonias-horarios
// Vista pública: colonias con su ruta y horario estimado.
// No expone domicilios ni usuarios.
export async function GET(request: NextRequest) {
  const coloniaId = request.nextUrl.searchParams.get('coloniaId');
  const supabase = createAdminClient();

  let query = supabase.from('vista_publica_colonias_horarios').select('*');
  if (coloniaId) query = query.eq('colonia_id', coloniaId);

  const { data, error } = await query.order('colonia', { ascending: true });
  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [] });
}
