'use client';

import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';

interface ColoniaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  colonia?: any; // Si existe, estamos editando
}

export default function ColoniaModal({ isOpen, onClose, onSave, colonia }: ColoniaModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    latitud: '',
    longitud: '',
    activa: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (colonia) {
      setFormData({
        nombre: colonia.nombre || '',
        descripcion: colonia.descripcion || '',
        latitud: colonia.latitud !== null ? String(colonia.latitud) : '',
        longitud: colonia.longitud !== null ? String(colonia.longitud) : '',
        activa: colonia.activa ?? true,
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        latitud: '',
        longitud: '',
        activa: true,
      });
    }
    setError('');
  }, [colonia, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEdit = !!colonia;
      const url = isEdit ? `/api/admin/colonias/${colonia.id}` : '/api/admin/colonias';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        latitud: formData.latitud ? Number(formData.latitud) : null,
        longitud: formData.longitud ? Number(formData.longitud) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la colonia');
      }

      onSave(); // Refrescar lista y cerrar
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
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <MapPin size={20} className="text-[var(--rc-blue-600)]" />
            {colonia ? 'Editar Colonia' : 'Nueva Colonia'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form id="colonia-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre de la colonia *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Centro HistA3rico"
                required
              />
            </div>

            <div>
              <label className="label">DescripciA3n (Opcional)</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="input min-h-[80px] resize-y"
                placeholder="Detalles adicionales sobre la colonia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Latitud (Opcional)</label>
                <input
                  type="number"
                  step="any"
                  name="latitud"
                  value={formData.latitud}
                  onChange={handleChange}
                  className="input font-mono text-sm"
                  placeholder="20.5281"
                />
              </div>
              <div>
                <label className="label">Longitud (Opcional)</label>
                <input
                  type="number"
                  step="any"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleChange}
                  className="input font-mono text-sm"
                  placeholder="-100.8123"
                />
              </div>
            </div>
            
            <p className="text-xs text-[var(--rc-slate-500)] bg-gray-50 p-2 rounded border border-gray-100">
              Las coordenadas (latitud/longitud) marcan el centro representativo de la colonia en el mapa.
            </p>

            <div>
              <label className="label">Estado</label>
              <div className="mt-2 flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleChange}
                    className="w-4 h-4 text-[var(--rc-emerald-600)] rounded border-gray-300 focus:ring-[var(--rc-emerald-600)]"
                  />
                  <span className="text-sm text-gray-700 font-medium">Activa (Habilitar colonia)</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="colonia-form" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Colonia'}
          </button>
        </div>
      </div>
    </div>
  );
}
