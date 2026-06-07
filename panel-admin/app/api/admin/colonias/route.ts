import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/colonias
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const activa = searchParams.get('activa');

  const supabase = await createClient();

  let query = supabase.from('colonias').select('*', { count: 'exact' });

  if (activa !== null && activa !== undefined) {
    query = query.eq('activa', activa === 'true');
  }
  if (search) {
    query = query.ilike('nombre', `%${search}%`);
  }

  query = query.range(offset, offset + limit - 1).order('nombre', { ascending: true });

  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);

  return jsonOk({
    data: data ?? [],
    pagination: buildPagination(page, limit, count ?? 0),
  });
});

// POST /api/admin/colonias
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  const { nombre, descripcion, latitud, longitud, activa } = body;

  if (!nombre) {
    return jsonError('El nombre de la colonia es requerido', 400);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('colonias')
    .insert({
      nombre,
      descripcion: descripcion || null,
      latitud: latitud !== undefined ? Number(latitud) : null,
      longitud: longitud !== undefined ? Number(longitud) : null,
      activa: activa ?? true
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique violation
      return jsonError('Ya existe una colonia con ese nombre', 400);
    }
    return jsonError(error.message, 500);
  }

  return jsonCreated(data);
});
