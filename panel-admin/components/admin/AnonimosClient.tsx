'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  Eye,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from './DataTableSkeleton';

interface Estadisticas {
  kpis: {
    conectados_ahora: number;
    sesiones_hoy: number;
    eventos_hoy: number;
    reportes_anonimos: number;
    total_sesiones_7d: number;
  };
  top_colonias: { colonia_id: string; colonia: string; total: number }[];
  distribucion_eventos: { tipo: string; total: number }[];
  serie_diaria: { fecha: string; sesiones: number; eventos: number }[];
}

interface Sesion {
  id: string;
  session_token: string;
  tipo: string;
  colonia_id: string | null;
  plataforma: string | null;
  activo: boolean;
  ultimo_uso_en: string | null;
  creado_en: string;
}

const TIPO_EVENTO_LABEL: Record<string, string> = {
  consulta_colonia: 'Consulta colonia',
  consulta_horario: 'Consulta horario',
  consulta_ubicacion_camion: 'Ubicación camión',
  consulta_aviso: 'Consulta aviso',
  intento_registrar_domicilio: 'Intento registrar domicilio',
  intento_activar_notificaciones: 'Intento activar push',
  conversion_a_registrado: 'Conversión a registrado',
};

// Paleta basada en variables CSS del proyecto.
const CHART_COLORS = [
  'var(--rc-blue-600)',
  'var(--rc-green-600)',
  'var(--rc-blue-700)',
  'var(--rc-green-500)',
  'var(--rc-wine-500)',
  'var(--rc-amber-500)',
  'var(--rc-slate-500)',
];

function formatFechaCorta(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function formatFechaHora(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AnonimosClient() {
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSesiones, setLoadingSesiones] = useState(true);

  const fetchAll = async () => {
    setLoadingStats(true);
    setLoadingSesiones(true);
    try {
      const [statsRes, sesionesRes] = await Promise.all([
        fetch('/api/admin/anonimos/estadisticas'),
        fetch('/api/admin/anonimos/sesiones?limit=10'),
      ]);
      const statsJson = await statsRes.json();
      const sesionesJson = await sesionesRes.json();
      if (statsRes.ok) setStats(statsJson);
      if (sesionesRes.ok && sesionesJson.data) setSesiones(sesionesJson.data);
    } catch (error) {
      console.error('Error fetching anonimos stats:', error);
    } finally {
      setLoadingStats(false);
      setLoadingSesiones(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const kpis = stats?.kpis;

  return (
    <>
      <PageHeader
        title="Sesiones Anónimas"
        description="Monitoreo de usuarios en modo invitado y actividad limitada"
      />

      {/* KPI Cards — misma estructura que el dashboard general */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard
          icon={<Users size={24} className="text-[var(--rc-blue-600)]" />}
          iconBg="bg-[var(--rc-blue-50)]"
          value={kpis?.conectados_ahora ?? 0}
          label="Conectados ahora"
          hint="Últimos 5 min"
          loading={loadingStats}
        />
        <KpiCard
          icon={<Activity size={24} className="text-[var(--rc-green-600)]" />}
          iconBg="bg-[var(--rc-green-50)]"
          value={kpis?.sesiones_hoy ?? 0}
          label="Sesiones hoy"
          loading={loadingStats}
        />
        <KpiCard
          icon={<Eye size={24} className="text-[var(--rc-blue-600)]" />}
          iconBg="bg-[var(--rc-blue-50)]"
          value={kpis?.eventos_hoy ?? 0}
          label="Eventos hoy"
          loading={loadingStats}
        />
        <KpiCard
          icon={<AlertTriangle size={24} className="text-orange-500" />}
          iconBg="bg-orange-50"
          value={kpis?.reportes_anonimos ?? 0}
          label="Consultas anónimas (7d)"
          loading={loadingStats}
        />
      </div>

      {/* Gráficas: barras + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top colonias — barras horizontales */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--rc-blue-800)]">
              Top colonias con conexiones anónimas
            </h2>
            <span className="text-xs text-gray-500">Últimos 7 días</span>
          </div>
          {loadingStats ? (
            <div className="h-72 skeleton" />
          ) : stats && stats.top_colonias.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.top_colonias}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rc-slate-200)" />
                <XAxis type="number" stroke="var(--rc-slate-500)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="colonia"
                  stroke="var(--rc-slate-500)"
                  fontSize={12}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid var(--rc-slate-200)',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                  cursor={{ fill: 'var(--rc-blue-50)' }}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]} fill="var(--rc-blue-600)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Aún no hay conexiones anónimas registradas." />
          )}
        </div>

        {/* Distribución eventos — donut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--rc-blue-800)]">
              Tipo de eventos
            </h2>
            <span className="text-xs text-gray-500">7d</span>
          </div>
          {loadingStats ? (
            <div className="h-72 skeleton" />
          ) : stats && stats.distribucion_eventos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.distribucion_eventos.map((d) => ({
                    name: TIPO_EVENTO_LABEL[d.tipo] ?? d.tipo,
                    value: d.total,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.distribucion_eventos.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid var(--rc-slate-200)',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: 'var(--rc-slate-600)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Sin eventos en el periodo." />
          )}
        </div>
      </div>

      {/* Serie diaria — área */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--rc-blue-800)]">
            Actividad anónima por día
          </h2>
          <span className="text-xs text-gray-500">Últimos 7 días</span>
        </div>
        {loadingStats ? (
          <div className="h-64 skeleton" />
        ) : stats ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={stats.serie_diaria.map((d) => ({
                fecha: formatFechaCorta(d.fecha),
                Sesiones: d.sesiones,
                Eventos: d.eventos,
              }))}
              margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradSesiones" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--rc-blue-600)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--rc-blue-600)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEventos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--rc-green-600)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--rc-green-600)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--rc-slate-200)" />
              <XAxis dataKey="fecha" stroke="var(--rc-slate-500)" fontSize={12} />
              <YAxis stroke="var(--rc-slate-500)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--rc-slate-200)',
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: 'var(--rc-slate-600)' }}
              />
              <Area
                type="monotone"
                dataKey="Sesiones"
                stroke="var(--rc-blue-600)"
                strokeWidth={2}
                fill="url(#gradSesiones)"
              />
              <Area
                type="monotone"
                dataKey="Eventos"
                stroke="var(--rc-green-600)"
                strokeWidth={2}
                fill="url(#gradEventos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Tabla de sesiones recientes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--rc-blue-800)]">
            Sesiones recientes
          </h2>
          <span className="text-xs text-gray-500">
            {sesiones.length} mostradas
          </span>
        </div>
        {loadingSesiones ? (
          <div className="p-6">
            <DataTableSkeleton columns={5} rows={6} />
          </div>
        ) : sesiones.length === 0 ? (
          <EmptyState text="Aún no hay sesiones anónimas registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--rc-slate-50)] text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Token</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Plataforma</th>
                  <th className="px-6 py-3 font-semibold">Último uso</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sesiones.map((s) => {
                  const activa =
                    s.activo &&
                    s.ultimo_uso_en &&
                    Date.now() - new Date(s.ultimo_uso_en).getTime() < 5 * 60 * 1000;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[var(--rc-blue-800)]">
                        {s.session_token.slice(0, 12)}…
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-700">
                        {s.tipo}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {s.plataforma ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatFechaHora(s.ultimo_uso_en)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                            activa
                              ? 'bg-[var(--rc-green-50)] text-[var(--rc-green-700)]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <MapPin size={12} />
                          {activa ? 'En línea' : 'Inactiva'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function KpiCard({
  icon,
  iconBg,
  value,
  label,
  hint,
  loading,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  hint?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {hint && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
            {hint}
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-16 skeleton mb-1" />
      ) : (
        <div className="text-3xl font-black text-[var(--rc-blue-800)] mb-1">{value}</div>
      )}
      <div className="text-sm font-medium text-gray-500">{label}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users size={32} className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
