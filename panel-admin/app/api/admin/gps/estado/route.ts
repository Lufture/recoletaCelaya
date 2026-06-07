import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/gps/estado
export const GET = withAuth(async (_request, _context, _user) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vista_gps_estado_camiones')
    .select('*');

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [] });
});
