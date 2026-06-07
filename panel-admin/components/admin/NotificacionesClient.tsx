'use client';

import { useState, useEffect } from 'react';
import { Filter, Bell } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from './DataTableSkeleton';

const EVENTO_LABELS: Record<string, { label: string; color: string }> = {
  route_start: { label: 'Ruta Iniciada', color: 'bg-blue-100 text-blue-800' },
  truck_proximity: { label: 'Camión Cercano', color: 'bg-emerald-100 text-emerald-800' },
  route_completed: { label: 'Ruta Completada', color: 'bg-green-100 text-green-800' },
  gps_disconnected: { label: 'GPS Desconectado', color: 'bg-red-100 text-red-800' },
  driver_report: { label: 'Reporte Chofer', color: 'bg-amber-100 text-amber-800' },
  general_notice: { label: 'Aviso General', color: 'bg-purple-100 text-purple-800' },
};

export default function NotificacionesClient() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventoFilter, setEventoFilter] = useState('');
  const [enviadoFilter, setEnviadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (eventoFilter) params.append('evento', eventoFilter);
      if (enviadoFilter) params.append('enviado', enviadoFilter);

      const res = await fetch(`/api/admin/notificaciones?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setNotificaciones(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [page, eventoFilter, enviadoFilter]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description="Historial de notificaciones enviadas a ciudadanos"
      />

      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={eventoFilter}
              onChange={(e) => setEventoFilter(e.target.value)}
            >
              <option value="">Todos los eventos</option>
              <option value="route_start">Ruta Iniciada</option>
              <option value="truck_proximity">Camión Cercano</option>
              <option value="route_completed">Ruta Completada</option>
              <option value="gps_disconnected">GPS Desconectado</option>
              <option value="driver_report">Reporte Chofer</option>
              <option value="general_notice">Aviso General</option>
            </select>
          </div>
          <div className="w-full md:w-48 relative">
            <Bell className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={enviadoFilter}
              onChange={(e) => setEnviadoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Enviadas</option>
              <option value="false">Pendientes</option>
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
                  <th className="px-6 py-4">Notificación</th>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Creada</th>
                  <th className="px-6 py-4">Enviada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notificaciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron notificaciones
                    </td>
                  </tr>
                ) : (
                  notificaciones.map((notif) => {
                    const eventoInfo = EVENTO_LABELS[notif.evento] || { label: notif.evento || '-', color: 'bg-gray-100 text-gray-800' };
                    return (
                      <tr key={notif.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-[var(--rc-blue-800)]">{notif.titulo}</div>
                          <div className="text-xs text-[var(--rc-slate-500)] mt-0.5 max-w-xs truncate">{notif.mensaje}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventoInfo.color}`}>
                            {eventoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 ${notif.enviado ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${notif.enviado ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {notif.enviado ? 'Enviada' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          {formatDate(notif.creado_en)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          {formatDate(notif.enviado_en)}
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
    </>
  );
}
