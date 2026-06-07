'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Search, Filter } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import UsuarioModal from './UsuarioModal';
import DataTableSkeleton from './DataTableSkeleton';

export default function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (rolFilter) params.append('rol', rolFilter);

      const res = await fetch(`/api/admin/usuarios?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setUsuarios(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [page, search, rolFilter]);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este usuario?')) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsuarios();
      } else {
        const json = await res.json();
        alert(json.error || 'Error al desactivar usuario');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    }
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administradores, choferes y ciudadanos registrados"
        actions={
          <button onClick={handleCreate} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Nuevo usuario
          </button>
        }
      />

      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="input pl-10 bg-white"
              value={rolFilter}
              onChange={(e) => setRolFilter(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="chofer">Chofer</option>
              <option value="ciudadano">Ciudadano</option>
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
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--rc-blue-800)]">
                          {user.nombre} {user.apellidos}
                        </div>
                        <div className="text-[var(--rc-slate-500)] text-xs mt-0.5">
                          {user.correo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${user.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.rol === 'chofer' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.telefono || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 ${user.activo ? 'text-emerald-600' : 'text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.activo && (
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Desactivar"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination placeholder */}
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

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => fetchUsuarios()}
        user={selectedUser}
      />
    </>
  );
}
