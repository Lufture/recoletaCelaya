'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Edit, Power, PowerOff, Filter } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from './DataTableSkeleton';
import ColoniaModal from './ColoniaModal';

export default function ColoniasClient() {
  const [colonias, setColonias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activaFilter, setActivaFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColonia, setSelectedColonia] = useState<any>(null);

  const fetchColonias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (activaFilter) params.append('activa', activaFilter);

      const res = await fetch(`/api/admin/colonias?${params.toString()}`);
      const json = await res.json();
      
      if (res.ok && json.data) {
        setColonias(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching colonias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchColonias();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, activaFilter, page]);

  const handleOpenCreate = () => {
    setSelectedColonia(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (colonia: any) => {
    setSelectedColonia(colonia);
    setIsModalOpen(true);
  };

  const toggleEstado = async (id: string, currentState: boolean) => {
    if (!confirm(`${currentState ? 'Desactivar' : 'Activar'} esta colonia?`)) return;
    
    try {
      const res = await fetch(`/api/admin/colonias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !currentState }),
      });
      if (res.ok) {
        fetchColonias();
      }
    } catch (error) {
      console.error('Error toggling estado:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <PageHeader
        title="Colonias"
        description="Gestión del catálogo de colonias para rutas y recolección."
        actions={
          <button onClick={handleOpenCreate} className="btn-primary">
            <Plus size={18} className="mr-2" />
            Nueva Colonia
          </button>
        }
      />

      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="input pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={activaFilter}
              onChange={(e) => { setActivaFilter(e.target.value); setPage(1); }}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <DataTableSkeleton columns={5} rows={10} />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--rc-slate-500)] bg-gray-50 border-b border-gray-100 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Colonia</th>
                  <th className="px-6 py-4">Coordenadas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Agregada el</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {colonias.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-1">No se encontraron colonias</p>
                      <p>Intenta ajustar tus filtros de búsqueda o agrega una nueva colonia.</p>
                    </td>
                  </tr>
                ) : (
                  colonias.map((colonia) => (
                    <tr key={colonia.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--rc-blue-800)]">{colonia.nombre}</div>
                        {colonia.descripcion && (
                          <div className="text-xs text-[var(--rc-slate-500)] mt-0.5 max-w-xs truncate">
                            {colonia.descripcion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {colonia.latitud && colonia.longitud ? (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${colonia.latitud},${colonia.longitud}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-[var(--rc-blue-600)] bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            <MapPin size={12} /> {colonia.latitud}, {colonia.longitud}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No definidas</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {colonia.activa ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                        {formatDate(colonia.creado_en)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(colonia)}
                            className="p-1.5 text-gray-400 hover:text-[var(--rc-blue-600)] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => toggleEstado(colonia.id, colonia.activa)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              colonia.activa 
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={colonia.activa ? "Desactivar" : "Activar"}
                          >
                            {colonia.activa ? <PowerOff size={16} /> : <Power size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-[var(--rc-slate-500)] bg-gray-50">
            <div>Página <span className="font-semibold text-gray-900">{page}</span> de <span className="font-semibold text-gray-900">{totalPages}</span></div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white font-medium transition-colors"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages} 
                className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white font-medium transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ColoniaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchColonias}
        colonia={selectedColonia}
      />
    </>
  );
}
