import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/recorridos/[recorridoId]/finalizar
export const POST = withAuth(async (request, context, _user) => {
  const { recorridoId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recorridos')
    .update({
      estado: 'finalizado',
      kilometraje_fin: body.kilometrajeFin,
      retorno_base_confirmado: true,
    })
    .eq('id', recorridoId)
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonOk(data);
});
