import { type NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/reportes-ciudadanos/[reporteId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reporteId: string }> }
) {
  const { reporteId } = await params;

  if (!reporteId) {
    return jsonError('ID de reporte requerido', 400);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError('Body JSON inválido', 400);
  }

  const { estado } = body;

  if (!estado) {
    return jsonError('Faltan campos obligatorios para actualizar (ej. estado)', 400);
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('reportes_ciudadanos')
      .update({ estado })
      .eq('id', reporteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reporte ciudadano:', error);
      return jsonError(`Error al actualizar reporte: ${error.message}`, 500);
    }

    return jsonOk({ data });
  } catch (err: any) {
    console.error('Error in PATCH /api/admin/reportes-ciudadanos/[reporteId]:', err);
    return jsonError('Error interno del servidor', 500);
  }
}
