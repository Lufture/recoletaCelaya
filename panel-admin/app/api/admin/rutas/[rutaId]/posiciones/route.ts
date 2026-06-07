import { withAuth, jsonOk, jsonCreated, jsonError, jsonSuccess } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/rutas/[rutaId]/posiciones
export const GET = withAuth(async (_request, context, _user) => {
  const { rutaId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ruta_posiciones')
    .select('*, colonias(id, nombre, latitud, longitud)')
    .eq('ruta_id', rutaId)
    .order('position_id');

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [] });
});

// POST /api/admin/rutas/[rutaId]/posiciones
// Acepta un array de posiciones para guardado batch
export const POST = withAuth(async (request, context, _user) => {
  const { rutaId } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  // Soportar array de posiciones (batch) o una sola posición
  const posiciones = Array.isArray(body) ? body : [body];

  if (posiciones.length === 0) {
    return jsonError('Se requiere al menos una posición', 400);
  }

  const rows = posiciones.map((p: any) => ({
    ruta_id: rutaId,
    position_id: p.positionId,
    colonia_id: p.coloniaId || null,
    latitud: p.latitud ?? null,
    longitud: p.longitud ?? null,
    velocidad_referencia_kmh: p.velocidadReferenciaKmh ?? null,
    es_base_salida: p.esBaseSalida ?? false,
    es_punto_proximidad: p.esPuntoProximidad ?? false,
    es_retorno_base: p.esRetornoBase ?? false,
    descripcion: p.descripcion ?? null,
  }));

  const { data, error } = await supabase
    .from('ruta_posiciones')
    .insert(rows)
    .select();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});

// DELETE /api/admin/rutas/[rutaId]/posiciones
// Elimina todas las posiciones de una ruta (para re-insertar al editar)
export const DELETE = withAuth(async (_request, context, _user) => {
  const { rutaId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('ruta_posiciones')
    .delete()
    .eq('ruta_id', rutaId);

  if (error) return jsonError(error.message, 500);
  return jsonSuccess('Posiciones eliminadas correctamente');
});
