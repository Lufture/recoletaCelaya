import { type NextRequest } from 'next/server';
import { withAuth, jsonOk } from '@/lib/api-helpers';
import type { DashboardData } from '@/lib/types/database';

// GET /api/admin/dashboard
export const GET = withAuth(async (_request, _context, _user) => {
  // TODO: Query Supabase for real metrics
  const data: DashboardData = {
    camionesActivos: 0,
    rutasActivas: 0,
    recorridosEnCurso: 0,
    alertasPendientes: 0,
    reportesChoferPendientes: 0,
    gpsDesconectados: 0,
    ciudadanosRegistrados: 0,
    choferesActivos: 0,
    sesionesAnonimasActivas: 0,
    consumoEstimadoDiaLitros: { minimo: 0, maximo: 0 },
  };

  return jsonOk(data);
});
