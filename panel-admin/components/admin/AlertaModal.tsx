'use client';

import { X, MapPin, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerta: any;
  onUpdateEstado: (id: string, estado: string) => void;
}

export default function AlertaModal({ isOpen, onClose, alerta, onUpdateEstado }: AlertaModalProps) {
  if (!isOpen || !alerta) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'nueva': return 'bg-red-100 text-red-700';
      case 'vista': return 'bg-yellow-100 text-yellow-700';
      case 'en_revision': return 'bg-blue-100 text-blue-700';
      case 'resuelta': return 'bg-emerald-100 text-emerald-700';
      case 'descartada': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleEstadoChange = (nuevoEstado: string) => {
    onUpdateEstado(alerta.id, nuevoEstado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Detalle de Alerta</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* Main Info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-[var(--rc-blue-900)]">{alerta.titulo}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getBadgeColor(alerta.estado)}`}>
                {alerta.estado.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[var(--rc-slate-600)] text-sm">{alerta.mensaje}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-gray-50/50 p-3 shadow-none border border-gray-100">
              <div className="flex items-center gap-2 text-[var(--rc-slate-500)] text-xs mb-1 font-medium uppercase">
                <Info size={14} />
                Tipo de Alerta
              </div>
              <div className="text-sm font-semibold capitalize text-gray-800">
                {alerta.tipo.replace('_', ' ')}
              </div>
            </div>

            <div className="card bg-gray-50/50 p-3 shadow-none border border-gray-100">
              <div className="flex items-center gap-2 text-[var(--rc-slate-500)] text-xs mb-1 font-medium uppercase">
                <Clock size={14} />
                Fecha y Hora
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {formatDate(alerta.creado_en)}
              </div>
            </div>
          </div>

          {/* Location if exists */}
          {(alerta.latitud || alerta.longitud) && (
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-[var(--rc-blue-600)]" />
                Ubicación del incidente
              </h4>
              <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] text-gray-500 text-sm">
                <p>Latitud: <span className="font-mono text-gray-800">{alerta.latitud}</span></p>
                <p>Longitud: <span className="font-mono text-gray-800">{alerta.longitud}</span></p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${alerta.latitud},${alerta.longitud}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 text-blue-600 hover:underline flex items-center gap-1"
                >
                  <MapPin size={14} /> Ver en Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Raw Data if exists */}
          {alerta.datos && Object.keys(alerta.datos).length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-2">Datos Adicionales</h4>
              <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(alerta.datos, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-2">
          {alerta.estado === 'nueva' && (
            <button onClick={() => handleEstadoChange('vista')} className="btn-secondary text-xs">
              Marcar como Vista
            </button>
          )}
          {(alerta.estado === 'nueva' || alerta.estado === 'vista' || alerta.estado === 'en_revision') && (
            <button onClick={() => handleEstadoChange('resuelta')} className="btn-primary text-xs flex items-center gap-1">
              <CheckCircle size={14} /> Marcar Resuelta
            </button>
          )}
          {alerta.estado !== 'descartada' && alerta.estado !== 'resuelta' && (
            <button onClick={() => handleEstadoChange('descartada')} className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
              Descartar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
