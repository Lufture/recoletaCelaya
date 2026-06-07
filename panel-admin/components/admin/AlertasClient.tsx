'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from './DataTableSkeleton';

import AlertaModal from './AlertaModal';

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  gps_desconectado: { label: 'GPS Desconectado', color: 'bg-red-100 text-red-800' },
  gps_estatico: { label: 'GPS Estático', color: 'bg-amber-100 text-amber-800' },
  bateria_baja: { label: 'Batería Baja', color: 'bg-orange-100 text-orange-800' },
  sos: { label: 'SOS', color: 'bg-red-200 text-red-900' },
  reporte_chofer: { label: 'Reporte Chofer', color: 'bg-blue-100 text-blue-800' },
  retraso_ruta: { label: 'Retraso Ruta', color: 'bg-purple-100 text-purple-800' },
  fallback_gps: { label: 'Fallback GPS', color: 'bg-gray-100 text-gray-800' },
  otro: { label: 'Otro', color: 'bg-gray-100 text-gray-800' },
};

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  nueva: { label: 'Nueva', color: 'bg-red-100 text-red-700' },
  vista: { label: 'Vista', color: 'bg-yellow-100 text-yellow-700' },
  en_revision: { label: 'En Revisión', color: 'bg-blue-100 text-blue-700' },
  resuelta: { label: 'Resuelta', color: 'bg-emerald-100 text-emerald-700' },
  descartada: { label: 'Descartada', color: 'bg-gray-100 text-gray-600' },
};

export default function AlertasClient() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAlerta, setSelectedAlerta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (estadoFilter) params.append('estado', estadoFilter);
      if (tipoFilter) params.append('tipo', tipoFilter);

      const res = await fetch(`/api/admin/alertas?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setAlertas(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, [page, estadoFilter, tipoFilter]);

  const updateEstado = async (alertaId: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/admin/alertas/${alertaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        fetchAlertas();
        if (selectedAlerta && selectedAlerta.id === alertaId) {
          setSelectedAlerta({ ...selectedAlerta, estado: nuevoEstado });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenDetalle = (alerta: any) => {
    setSelectedAlerta(alerta);
    setIsModalOpen(true);
    // Si la alerta es nueva, automáticamente la marcamos como vista al abrir el detalle
    if (alerta.estado === 'nueva') {
      updateEstado(alerta.id, 'vista');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <PageHeader
        title="Alertas"
        description="Alertas administrativas: GPS, SOS, reportes y más"
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
              <option value="nueva">Nueva</option>
              <option value="vista">Vista</option>
              <option value="en_revision">En Revisión</option>
              <option value="resuelta">Resuelta</option>
              <option value="descartada">Descartada</option>
            </select>
          </div>
          <div className="w-full md:w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="gps_desconectado">GPS Desconectado</option>
              <option value="gps_estatico">GPS Estático</option>
              <option value="sos">SOS</option>
              <option value="reporte_chofer">Reporte Chofer</option>
              <option value="retraso_ruta">Retraso Ruta</option>
              <option value="bateria_baja">Batería Baja</option>
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
                  <th className="px-6 py-4">Alerta</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alertas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron alertas
                    </td>
                  </tr>
                ) : (
                  alertas.map((alerta) => {
                    const tipoInfo = TIPO_LABELS[alerta.tipo] || TIPO_LABELS.otro;
                    const estadoInfo = ESTADO_LABELS[alerta.estado] || ESTADO_LABELS.nueva;
                    return (
                      <tr key={alerta.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenDetalle(alerta)}>
                          <div className="font-medium text-[var(--rc-blue-800)] hover:underline">{alerta.titulo}</div>
                          <div className="text-xs text-[var(--rc-slate-500)] mt-0.5 max-w-xs truncate">{alerta.mensaje}</div>
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
                          {formatDate(alerta.creado_en)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenDetalle(alerta)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <Eye size={16} />
                            </button>
                            {(alerta.estado === 'nueva' || alerta.estado === 'vista' || alerta.estado === 'en_revision') && (
                              <button
                                onClick={() => updateEstado(alerta.id, 'resuelta')}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Marcar como resuelta"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {alerta.estado !== 'descartada' && alerta.estado !== 'resuelta' && (
                              <button
                                onClick={() => updateEstado(alerta.id, 'descartada')}
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

      <AlertaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alerta={selectedAlerta}
        onUpdateEstado={updateEstado}
      />
    </>
  );
}
