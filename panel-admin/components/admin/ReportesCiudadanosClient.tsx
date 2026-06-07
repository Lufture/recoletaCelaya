'use client';

import { useState, useEffect } from 'react';
import { Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from './DataTableSkeleton';
import ReporteCiudadanoModal from './ReporteCiudadanoModal';

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  basura_no_recolectada: { label: 'Basura No Recolectada', color: 'bg-red-100 text-red-800' },
  punto_sucio: { label: 'Punto Sucio', color: 'bg-amber-100 text-amber-800' },
  sugerencia: { label: 'Sugerencia', color: 'bg-blue-100 text-blue-800' },
  queja: { label: 'Queja', color: 'bg-orange-100 text-orange-800' },
  otro: { label: 'Otro', color: 'bg-gray-100 text-gray-800' },
};

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'bg-red-100 text-red-700' },
  en_revision: { label: 'En Revisión', color: 'bg-blue-100 text-blue-700' },
  resuelto: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700' },
  descartado: { label: 'Descartado', color: 'bg-gray-100 text-gray-600' },
};

export default function ReportesCiudadanosClient() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReporte, setSelectedReporte] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReportes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (estadoFilter) params.append('estado', estadoFilter);
      if (tipoFilter) params.append('tipo', tipoFilter);

      const res = await fetch(`/api/admin/reportes-ciudadanos?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setReportes(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching reportes ciudadanos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, [page, estadoFilter, tipoFilter]);

  const updateEstado = async (reporteId: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/admin/reportes-ciudadanos/${reporteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) fetchReportes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewDetail = (reporte: any) => {
    setSelectedReporte(reporte);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <PageHeader
        title="Reportes Ciudadanos"
        description="Quejas, sugerencias y problemas reportados por los ciudadanos"
      />

      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="en_revision">En Revisión</option>
              <option value="resuelto">Resuelto</option>
              <option value="descartado">Descartado</option>
            </select>
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="basura_no_recolectada">Basura No Recolectada</option>
              <option value="punto_sucio">Punto Sucio</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="queja">Queja</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <DataTableSkeleton columns={5} rows={5} />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--rc-slate-500)] bg-gray-50 border-b border-gray-100 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Reporte</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron reportes ciudadanos
                    </td>
                  </tr>
                ) : (
                  reportes.map((reporte) => {
                    const tipoInfo = TIPO_LABELS[reporte.tipo] || TIPO_LABELS.otro;
                    const estadoInfo = ESTADO_LABELS[reporte.estado] || ESTADO_LABELS.nuevo;
                    return (
                      <tr key={reporte.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-[var(--rc-blue-800)]">{reporte.tipo.replace(/_/g, ' ').toUpperCase()}</div>
                          <div className="text-xs text-[var(--rc-slate-500)] mt-0.5 max-w-xs truncate">{reporte.descripcion || 'Sin descripción'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                            {tipoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          {formatDate(reporte.creado_en)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewDetail(reporte)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver Detalle"
                            >
                              <Eye size={16} />
                            </button>
                            {reporte.estado !== 'resuelto' && reporte.estado !== 'descartado' && (
                              <button
                                onClick={() => updateEstado(reporte.id, 'resuelto')}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Marcar como resuelto"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {reporte.estado !== 'descartado' && reporte.estado !== 'resuelto' && (
                              <button
                                onClick={() => updateEstado(reporte.id, 'descartado')}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Descartar"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>Página {page} de {totalPages}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>

      <ReporteCiudadanoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reporte={selectedReporte}
      />
    </>
  );
}
