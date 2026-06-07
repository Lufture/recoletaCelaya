import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/camiones/[camionId]
export const GET = withAuth(async (_request, context, _user) => {
  const { camionId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('camiones')
    .select('*, dispositivos_gps(*), rutas(id, route_id, nombre)')
    .eq('id', camionId)
    .single();

  if (error || !data) return jsonError('Camión no encontrado', 404);
  return jsonOk(data);
});

// PATCH /api/admin/camiones/[camionId]
export const PATCH = withAuth(async (request, context, _user) => {
  const { camionId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (body.clave !== undefined) updates.clave = body.clave;
  if (body.nombre !== undefined) updates.nombre = body.nombre;
  if (body.estado !== undefined) updates.estado = body.estado;
  if (body.truckIdExterno !== undefined) updates.truck_id_externo = body.truckIdExterno;
  if (body.consumoMinLitrosDia !== undefined) updates.consumo_min_litros_dia = body.consumoMinLitrosDia;
  if (body.consumoMaxLitrosDia !== undefined) updates.consumo_max_litros_dia = body.consumoMaxLitrosDia;
  if (body.capacidadCombustibleLitros !== undefined) updates.capacidad_combustible_litros = body.capacidadCombustibleLitros;
  if (body.observacionesGps !== undefined) updates.observaciones_gps = body.observacionesGps;
  if (body.rutaId !== undefined) updates.ruta_id = body.rutaId || null;

  const { data, error } = await supabase.from('camiones').update(updates).eq('id', camionId).select('*, rutas(id, route_id, nombre)').single();
  if (error) return jsonError(error.message, 400);
  return jsonOk(data);
});
