import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/usuarios/choferes
export const GET = withAuth(async (request, _context, _user) => {
  const searchParams = request.nextUrl.searchParams;
  const activo = searchParams.get('activo');

  const supabase = await createClient();
  let query = supabase.from('perfiles').select('*').eq('rol', 'chofer');

  if (activo !== null) query = query.eq('activo', activo === 'true');

  const { data, error } = await query.order('nombre');

  if (error) return jsonError(error.message, 500);

  return jsonOk({ data: data ?? [] });
});
