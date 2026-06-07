'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user?: any; // If provided, edit mode
}

export default function UsuarioModal({ isOpen, onClose, onSave, user }: UsuarioModalProps) {
  const [camiones, setCamiones] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    rol: 'chofer',
    password: '',
    activo: true,
    camion_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCamiones = async () => {
      try {
        const res = await fetch('/api/admin/camiones?limit=100');
        const json = await res.json();
        if (res.ok && json.data) setCamiones(json.data);
      } catch (err) {
        console.error('Error fetching camiones', err);
      }
    };
    if (isOpen) fetchCamiones();
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      // Buscar si el usuario tiene un camión activo asignado
      const activeAsignacion = user.choferes_camiones?.find((c: any) => c.activo);
      
      setFormData({
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        correo: user.correo || '',
        telefono: user.telefono || '',
        rol: user.rol || 'chofer',
        password: '', // Blank by default when editing
        activo: user.activo ?? true,
        camion_id: activeAsignacion ? activeAsignacion.camion_id : '',
      });
    } else {
      setFormData({
        nombre: '',
        apellidos: '',
        correo: '',
        telefono: '',
        rol: 'chofer',
        password: '',
        activo: true,
        camion_id: '',
      });
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEdit = !!user;
      const url = isEdit ? `/api/admin/usuarios/${user.id}` : '/api/admin/usuarios';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload: any = { ...formData };
      if (isEdit && !payload.password) {
        delete payload.password; // Don't send empty password if editing
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar usuario');
      }

      onSave(); // Refresh data and close
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="usuario-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Correo *</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="input"
                required
                disabled={!!user} // Email can't be easily changed in Supabase without auth handling
              />
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Rol *</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className="input bg-white"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="chofer">Chofer</option>
                  <option value="ciudadano">Ciudadano</option>
                </select>
              </div>

              {formData.rol === 'chofer' && (
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Camión Asignado</label>
                  <select
                    name="camion_id"
                    value={formData.camion_id}
                    onChange={handleChange}
                    className="input bg-white"
                  >
                    <option value="">Sin asignar</option>
                    {camiones.map((camion: any) => (
                      <option key={camion.id} value={camion.id}>
                        {camion.clave} - {camion.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Estado</label>
                <div className="mt-2 flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                      className="w-4 h-4 text-[var(--primary)] rounded border-gray-300 focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="label">
                Contraseña {user ? '(Dejar en blanco para no cambiar)' : '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                required={!user}
                minLength={6}
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="usuario-form" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
