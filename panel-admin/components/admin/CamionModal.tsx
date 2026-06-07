'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CamionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  camion?: any; // If provided, edit mode
}

export default function CamionModal({ isOpen, onClose, onSave, camion }: CamionModalProps) {
  const [formData, setFormData] = useState({
    clave: '',
    nombre: '',
    estado: 'activo',
    truckIdExterno: '',
    consumoMinLitrosDia: 60.00,
    consumoMaxLitrosDia: 90.00,
    capacidadCombustibleLitros: 150.00,
    observacionesGps: '',
    rutaId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rutas, setRutas] = useState<any[]>([]);

  useEffect(() => {
    if (camion) {
      setFormData({
        clave: camion.clave || '',
        nombre: camion.nombre || '',
        estado: camion.estado || 'activo',
        truckIdExterno: camion.truck_id_externo?.toString() || '',
        consumoMinLitrosDia: camion.consumo_min_litros_dia || 60.00,
        consumoMaxLitrosDia: camion.consumo_max_litros_dia || 90.00,
        capacidadCombustibleLitros: camion.capacidad_combustible_litros || 150.00,
        observacionesGps: camion.observaciones_gps || '',
        rutaId: camion.ruta_id || '',
      });
    } else {
      setFormData({
        clave: '',
        nombre: '',
        estado: 'activo',
        truckIdExterno: '',
        consumoMinLitrosDia: 60.00,
        consumoMaxLitrosDia: 90.00,
        capacidadCombustibleLitros: 150.00,
        observacionesGps: '',
        rutaId: '',
      });
    }
    setError('');
  }, [camion, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/rutas?activo=true&limit=100', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(json => setRutas(json.data ?? []))
      .catch(() => setRutas([]));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    
    if (type === 'number') {
      val = value === '' ? '' : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEdit = !!camion;
      const url = isEdit ? `/api/admin/camiones/${camion.id}` : '/api/admin/camiones';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload: any = { ...formData };
      
      // Convirtiendo a tipos correctos (null en lugar de string vacio)
      if (payload.truckIdExterno === '') {
        payload.truckIdExterno = null;
      } else {
        payload.truckIdExterno = parseInt(payload.truckIdExterno, 10);
      }

      payload.rutaId = payload.rutaId || null;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar camión');
      }

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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {camion ? 'Editar Camión' : 'Nuevo Camión'}
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

          <form id="camion-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Información General</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Clave *</label>
                  <input
                    type="text"
                    name="clave"
                    value={formData.clave}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ej. TRK-01"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ej. Camión Norte"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Estado</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="input bg-white"
                    required
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div>
                  <label className="label">ID Externo (Opcional)</label>
                  <input
                    type="number"
                    name="truckIdExterno"
                    value={formData.truckIdExterno}
                    onChange={handleChange}
                    className="input"
                    placeholder="Para vincular con otra BD"
                  />
                </div>
              </div>

              <div>
                <label className="label">Ruta asignada</label>
                <select
                  name="rutaId"
                  value={formData.rutaId}
                  onChange={handleChange}
                  className="input bg-white"
                >
                  <option value="">Sin ruta asignada</option>
                  {rutas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_id} — {r.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Selecciona la ruta que este camión recorrerá
                </p>
              </div>
            </div>

            {/* Configuración de Combustible */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Combustible</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Consumo Min. (L/día)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="consumoMinLitrosDia"
                    value={formData.consumoMinLitrosDia}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Consumo Max. (L/día)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="consumoMaxLitrosDia"
                    value={formData.consumoMaxLitrosDia}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Cap. Tanque (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="capacidadCombustibleLitros"
                    value={formData.capacidadCombustibleLitros}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* GPS */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Configuración GPS</h3>
              <div>
                <label className="label">Observaciones GPS</label>
                <textarea
                  name="observacionesGps"
                  value={formData.observacionesGps}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Detalles sobre la instalación del dispositivo GPS..."
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="camion-form" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
