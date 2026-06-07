import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/camiones
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const estado = request.nextUrl.searchParams.get('estado');
  const search = request.nextUrl.searchParams.get('search');

  const supabase = await createClient();
  let query = supabase.from('camiones').select('*, rutas(id, route_id, nombre)', { count: 'exact' });

  if (estado) query = query.eq('estado', estado);
  if (search) query = query.or(`clave.ilike.%${search}%,nombre.ilike.%${search}%`);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});

// POST /api/admin/camiones
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  if (!body.clave || !body.nombre) return jsonError('clave y nombre son requeridos', 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('camiones')
    .insert({
      clave: body.clave,
      nombre: body.nombre,
      truck_id_externo: body.truckIdExterno,
      consumo_min_litros_dia: body.consumoMinLitrosDia,
      consumo_max_litros_dia: body.consumoMaxLitrosDia,
      capacidad_combustible_litros: body.capacidadCombustibleLitros,
      ruta_id: body.rutaId || null,
    })
    .select('*, rutas(id, route_id, nombre)')
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});
