import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/rutas
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const search = request.nextUrl.searchParams.get('search');
  const activo = request.nextUrl.searchParams.get('activo');

  const supabase = await createClient();
  let query = supabase.from('rutas').select('*', { count: 'exact' });

  if (activo !== null) query = query.eq('activo', activo === 'true');
  if (search) query = query.or(`route_id.ilike.%${search}%,nombre.ilike.%${search}%`);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});

// POST /api/admin/rutas
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  const { routeId, nombre, descripcion, colorMapa } = body;

  if (!routeId || !nombre) return jsonError('routeId y nombre son requeridos', 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rutas')
    .insert({ route_id: routeId, nombre, descripcion, color_mapa: colorMapa })
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});
