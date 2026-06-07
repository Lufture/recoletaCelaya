'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AvisoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  aviso?: any;
}

export default function AvisoModal({ isOpen, onClose, onSave, aviso }: AvisoModalProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'general',
    activo: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (aviso) {
      setFormData({
        titulo: aviso.titulo || '',
        mensaje: aviso.mensaje || '',
        tipo: aviso.tipo || 'general',
        activo: aviso.activo ?? true,
      });
    } else {
      setFormData({ titulo: '', mensaje: '', tipo: 'general', activo: true });
    }
    setError('');
  }, [aviso, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEdit = !!aviso;
      const url = isEdit ? `/api/admin/avisos/${aviso.id}` : '/api/admin/avisos';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar aviso');

      onSave();
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
            {aviso ? 'Editar Aviso' : 'Nuevo Aviso'}
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

          <form id="aviso-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Título *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Mensaje *</label>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                className="input min-h-[100px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select name="tipo" value={formData.tipo} onChange={handleChange} className="input bg-white">
                  <option value="general">General</option>
                  <option value="urgente">Urgente</option>
                  <option value="informativo">Informativo</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>
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
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>Cancelar</button>
          <button type="submit" form="aviso-form" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
