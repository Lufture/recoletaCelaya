'use client';

import { X, MapPin, User, Hash, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ReporteCiudadanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: any | null;
}

const ESTADO_COLORS: Record<string, string> = {
  nuevo: 'bg-red-100 text-red-700',
  en_revision: 'bg-blue-100 text-blue-700',
  resuelto: 'bg-emerald-100 text-emerald-700',
  descartado: 'bg-gray-100 text-gray-600',
};

const TIPO_COLORS: Record<string, string> = {
  basura_no_recolectada: 'bg-red-100 text-red-800',
  punto_sucio: 'bg-amber-100 text-amber-800',
  sugerencia: 'bg-blue-100 text-blue-800',
  queja: 'bg-orange-100 text-orange-800',
  otro: 'bg-gray-100 text-gray-800',
};

export default function ReporteCiudadanoModal({ isOpen, onClose, reporte }: ReporteCiudadanoModalProps) {
  if (!isOpen || !reporte) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
      time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDate(reporte.creado_en);
  const estadoColor = ESTADO_COLORS[reporte.estado] || ESTADO_COLORS.nuevo;
  const tipoColor = TIPO_COLORS[reporte.tipo] || TIPO_COLORS.otro;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-900">
              Detalle del Reporte
            </h2>
            <div className="flex gap-2 items-center text-sm">
              <span className={`px-2.5 py-0.5 rounded-full font-medium ${tipoColor}`}>
                {reporte.tipo.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-medium ${estadoColor}`}>
                {reporte.estado.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 self-start">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/30">
          
          {/* Main Description */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Descripción del ciudadano</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {reporte.descripcion || 'Sin descripción detallada.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Info panel */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID Ciudadano (Anónimo)</p>
                    <p className="font-medium text-gray-900 truncate max-w-[200px]" title={reporte.anonimo_id}>
                      {reporte.anonimo_id || 'No proporcionado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Colonia Relacionada</p>
                    <p className="font-medium text-gray-900">
                      {reporte.colonias?.nombre || 'No especificada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha de Reporte</p>
                    <p className="font-medium text-gray-900">{date}</p>
                    <p className="text-xs text-gray-500">{time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location / Action Panel */}
            <div className="space-y-4">
              {(reporte.latitud && reporte.longitud) ? (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600" /> Coordenadas exactas
                  </h3>
                  <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 text-sm overflow-hidden relative">
                    {/* Placeholder for real map */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}></div>
                    <MapPin size={32} className="text-gray-400 mb-2 relative z-10" />
                    <span className="relative z-10">{reporte.latitud}, {reporte.longitud}</span>
                  </div>
                  <div className="mt-3 text-center">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${reporte.latitud},${reporte.longitud}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Abrir en Google Maps
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50 shadow-sm flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900">Ubicación GPS no disponible</h3>
                    <p className="text-xs text-amber-700 mt-1">
                      El ciudadano no proporcionó coordenadas exactas para este reporte.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cerrar detalle
          </button>
        </div>

      </div>
    </div>
  );
}
