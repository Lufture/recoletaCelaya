import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/reportes-ciudadanos
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const estado = searchParams.get('estado');
  const tipo = searchParams.get('tipo');

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('reportes_ciudadanos')
      .select('*, colonias(nombre), perfiles!atendido_por(nombre)', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (tipo) query = query.eq('tipo', tipo);

    query = query.order('creado_en', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reportes ciudadanos:', error);
      return jsonError('Error al obtener reportes ciudadanos', 500);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return jsonOk({
      data,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/reportes-ciudadanos:', error);
    return jsonError('Error interno del servidor', 500);
  }
}
