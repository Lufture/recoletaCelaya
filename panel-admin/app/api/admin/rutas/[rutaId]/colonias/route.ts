import { withAuth, jsonOk, jsonCreated, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/rutas/[rutaId]/colonias
export const GET = withAuth(async (_request, context, _user) => {
  const { rutaId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('colonia_rutas')
    .select('*, colonias(nombre)')
    .eq('ruta_id', rutaId);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [] });
});

// POST /api/admin/rutas/[rutaId]/colonias
export const POST = withAuth(async (request, context, _user) => {
  const { rutaId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('colonia_rutas')
    .insert({
      colonia_id: body.coloniaId,
      ruta_id: rutaId,
      horario_estimado: body.horarioEstimado,
      hora_inicio_estimada: body.horaInicioEstimada,
      hora_fin_estimada: body.horaFinEstimada,
    })
    .select('*, colonias(nombre)')
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});
