'use client';

import { useState, useEffect } from 'react';
import { Edit2, Search, Filter, Truck, Route } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import CamionModal from './CamionModal';
import DataTableSkeleton from './DataTableSkeleton';

export default function CamionesClient() {
  const [camiones, setCamiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCamion, setSelectedCamion] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCamiones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (estadoFilter) params.append('estado', estadoFilter);

      const res = await fetch(`/api/admin/camiones?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setCamiones(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching camiones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamiones();
  }, [page, search, estadoFilter]);

  const handleCreate = () => {
    setSelectedCamion(null);
    setIsModalOpen(true);
  };

  const handleEdit = (camion: any) => {
    setSelectedCamion(camion);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Camiones"
        description="Administración de camiones recolectores"
        actions={
          <button onClick={handleCreate} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Nuevo camión
          </button>
        }
      />

      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por clave o nombre..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <DataTableSkeleton columns={6} rows={5} />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--rc-slate-500)] bg-gray-50 border-b border-gray-100 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Camión</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Ruta</th>
                  <th className="px-6 py-4">ID Externo</th>
                  <th className="px-6 py-4">Consumo Est. (L/día)</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {camiones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron camiones
                    </td>
                  </tr>
                ) : (
                  camiones.map((camion) => (
                    <tr key={camion.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--rc-blue-50)] flex items-center justify-center text-[var(--rc-blue-600)] shrink-0">
                            <Truck size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-[var(--rc-blue-800)]">
                              {camion.nombre}
                            </div>
                            <div className="text-[var(--rc-slate-500)] text-xs mt-0.5 font-mono">
                              {camion.clave}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${camion.estado === 'activo' ? 'bg-emerald-100 text-emerald-800' :
                            camion.estado === 'mantenimiento' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {camion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {camion.rutas ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: '#00897B' }}
                            />
                            <div>
                              <span className="text-xs font-semibold text-[var(--rc-blue-800)]">
                                {camion.rutas.route_id}
                              </span>
                              <span className="text-xs text-gray-400 ml-1.5">
                                {camion.rutas.nombre}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin ruta</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {camion.truck_id_externo || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {camion.consumo_min_litros_dia} - {camion.consumo_max_litros_dia} L
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(camion)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <CamionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => fetchCamiones()}
        camion={selectedCamion}
      />
    </>
  );
}
