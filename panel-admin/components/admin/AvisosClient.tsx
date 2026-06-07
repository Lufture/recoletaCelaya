'use client';

import { useState, useEffect } from 'react';
import { Filter, Edit2, Plus, Megaphone } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import AvisoModal from './AvisoModal';
import DataTableSkeleton from './DataTableSkeleton';

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-blue-100 text-blue-800' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  informativo: { label: 'Informativo', color: 'bg-emerald-100 text-emerald-800' },
  mantenimiento: { label: 'Mantenimiento', color: 'bg-amber-100 text-amber-800' },
};

export default function AvisosClient() {
  const [avisos, setAvisos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState<any>(null);

  // Filters
  const [activoFilter, setActivoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAvisos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (activoFilter) params.append('activo', activoFilter);
      if (tipoFilter) params.append('tipo', tipoFilter);

      const res = await fetch(`/api/admin/avisos?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setAvisos(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, [page, activoFilter, tipoFilter]);

  const handleCreate = () => {
    setSelectedAviso(null);
    setIsModalOpen(true);
  };

  const handleEdit = (aviso: any) => {
    setSelectedAviso(aviso);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <PageHeader
        title="Avisos"
        description="Avisos generales para ciudadanos"
        actions={
          <button onClick={handleCreate} className="btn-primary">
            <Plus size={16} />
            Nuevo aviso
          </button>
        }
      />

      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={activoFilter}
              onChange={(e) => setActivoFilter(e.target.value)}
            >
              <option value="">Todos (Estado)</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
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
              <option value="general">General</option>
              <option value="urgente">Urgente</option>
              <option value="informativo">Informativo</option>
              <option value="mantenimiento">Mantenimiento</option>
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
                  <th className="px-6 py-4">Aviso</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {avisos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron avisos
                    </td>
                  </tr>
                ) : (
                  avisos.map((aviso) => {
                    const tipoInfo = TIPO_LABELS[aviso.tipo] || TIPO_LABELS.general;
                    return (
                      <tr key={aviso.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${aviso.activo ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              <Megaphone size={16} />
                            </div>
                            <div>
                              <div className="font-medium text-[var(--rc-blue-800)]">{aviso.titulo}</div>
                              <div className="text-xs text-[var(--rc-slate-500)] mt-0.5 max-w-xs truncate">{aviso.mensaje}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                            {tipoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 ${aviso.activo ? 'text-emerald-600' : 'text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${aviso.activo ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                            {aviso.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          {formatDate(aviso.creado_en)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(aviso)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
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

      <AvisoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => fetchAvisos()}
        aviso={selectedAviso}
      />
    </>
  );
}
