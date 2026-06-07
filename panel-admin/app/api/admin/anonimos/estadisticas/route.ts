import { withAuth, jsonOk, jsonError } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

interface EventoRow {
  tipo: string;
  colonia_id: string | null;
  creado_en: string;
}

interface SesionRow {
  id: string;
  colonia_id: string | null;
  ultimo_uso_en: string | null;
  creado_en: string;
  activo: boolean;
  expira_en: string | null;
}

interface ColoniaRow {
  id: string;
  nombre: string;
}

// GET /api/admin/anonimos/estadisticas
// Métricas agregadas para el dashboard administrativo de sesiones anónimas.
export const GET = withAuth(async (_request, _context, _user) => {
  const supabase = createAdminClient();
  const ahora = Date.now();
  const hace5min = new Date(ahora - 5 * 60 * 1000).toISOString();
  const hoyInicio = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const hace7dias = new Date(ahora - 6 * 24 * 60 * 60 * 1000);
  hace7dias.setHours(0, 0, 0, 0);
  const desde7d = hace7dias.toISOString();

  const [sesionesRes, eventosRes, coloniasRes] = await Promise.all([
    supabase
      .from('sesiones_anonimas')
      .select('id, colonia_id, ultimo_uso_en, creado_en, activo, expira_en')
      .gte('creado_en', desde7d),
    supabase
      .from('eventos_anonimos')
      .select('tipo, colonia_id, creado_en')
      .gte('creado_en', desde7d),
    supabase.from('colonias').select('id, nombre'),
  ]);

  if (sesionesRes.error) return jsonError(sesionesRes.error.message, 500);
  if (eventosRes.error) return jsonError(eventosRes.error.message, 500);
  if (coloniasRes.error) return jsonError(coloniasRes.error.message, 500);

  const sesiones = (sesionesRes.data ?? []) as SesionRow[];
  const eventos = (eventosRes.data ?? []) as EventoRow[];
  const colonias = (coloniasRes.data ?? []) as ColoniaRow[];

  const nombrePorColonia = new Map(colonias.map((c) => [c.id, c.nombre]));

  // KPIs
  const conectadosAhora = sesiones.filter(
    (s) => s.activo && s.ultimo_uso_en && s.ultimo_uso_en >= hace5min
  ).length;

  const sesionesHoy = sesiones.filter((s) => s.creado_en >= hoyInicio).length;
  const eventosHoy = eventos.filter((e) => e.creado_en >= hoyInicio).length;

  const reportesAnonimos = eventos.filter(
    (e) =>
      e.tipo === 'consulta_ubicacion_camion' ||
      e.tipo === 'consulta_horario' ||
      e.tipo === 'consulta_aviso' ||
      e.tipo === 'consulta_colonia'
  ).length;

  // Top colonias por conexiones anónimas (sesiones creadas en 7d)
  const conteoColonia = new Map<string, number>();
  for (const s of sesiones) {
    if (!s.colonia_id) continue;
    conteoColonia.set(s.colonia_id, (conteoColonia.get(s.colonia_id) ?? 0) + 1);
  }
  const topColonias = Array.from(conteoColonia.entries())
    .map(([id, total]) => ({
      colonia_id: id,
      colonia: nombrePorColonia.get(id) ?? 'Sin nombre',
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Distribución por tipo de evento
  const conteoTipo = new Map<string, number>();
  for (const e of eventos) {
    conteoTipo.set(e.tipo, (conteoTipo.get(e.tipo) ?? 0) + 1);
  }
  const distribucionEventos = Array.from(conteoTipo.entries())
    .map(([tipo, total]) => ({ tipo, total }))
    .sort((a, b) => b.total - a.total);

  // Serie diaria (7 días)
  const diasMap = new Map<string, { sesiones: number; eventos: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(hace7dias.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    diasMap.set(key, { sesiones: 0, eventos: 0 });
  }
  for (const s of sesiones) {
    const key = s.creado_en.slice(0, 10);
    const cell = diasMap.get(key);
    if (cell) cell.sesiones += 1;
  }
  for (const e of eventos) {
    const key = e.creado_en.slice(0, 10);
    const cell = diasMap.get(key);
    if (cell) cell.eventos += 1;
  }
  const serieDiaria = Array.from(diasMap.entries()).map(([fecha, v]) => ({
    fecha,
    ...v,
  }));

  return jsonOk({
    kpis: {
      conectados_ahora: conectadosAhora,
      sesiones_hoy: sesionesHoy,
      eventos_hoy: eventosHoy,
      reportes_anonimos: reportesAnonimos,
      total_sesiones_7d: sesiones.length,
    },
    top_colonias: topColonias,
    distribucion_eventos: distribucionEventos,
    serie_diaria: serieDiaria,
  });
});
