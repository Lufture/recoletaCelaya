import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/avisos
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const activo = request.nextUrl.searchParams.get('activo');
  const tipo = request.nextUrl.searchParams.get('tipo');

  const supabase = await createClient();
  let query = supabase.from('avisos').select('*', { count: 'exact' });

  if (activo !== null) query = query.eq('activo', activo === 'true');
  if (tipo) query = query.eq('tipo', tipo);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });
  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);
  return jsonOk({ data: data ?? [], pagination: buildPagination(page, limit, count ?? 0) });
});

// POST /api/admin/avisos
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  if (!body.titulo || !body.mensaje) return jsonError('titulo y mensaje son requeridos', 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('avisos')
    .insert({
      titulo: body.titulo,
      mensaje: body.mensaje,
      tipo: body.tipo ?? 'general',
      colonia_id: body.coloniaId,
      ruta_id: body.rutaId,
      activo: body.activo ?? true,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 400);
  return jsonCreated(data);
});
