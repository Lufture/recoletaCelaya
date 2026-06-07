'use client';

/**
 * ReportesPage
 * ─────────────
 * Descarga de reportes en formato CSV.
 * Cada tarjeta llama a /api/admin/reportes?tipo=X&formato=csv
 * y dispara la descarga del archivo en el navegador.
 */

import { useState } from 'react';
import { Download, FileText, MapPin, Truck, Navigation, Route } from 'lucide-react';

interface ReporteTipo {
  tipo: string;
  titulo: string;
  descripcion: string;
  filename: string;
  icon: React.ReactNode;
  color: string;
}

const REPORTES: ReporteTipo[] = [
  {
    tipo: 'vista_publica_colonias_horarios',
    titulo: 'Horarios de Colonias',
    descripcion: 'Colonias con sus rutas asociadas y horarios estimados de recolección.',
    filename: 'horarios_colonias.csv',
    icon: <MapPin size={22} />,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    tipo: 'vista_recorridos_activos',
    titulo: 'Recorridos Activos',
    descripcion: 'Estado actual de los recorridos, incluyendo camión, chofer y última ubicación.',
    filename: 'recorridos_activos.csv',
    icon: <Route size={22} />,
    color: 'text-[#0f2a71] bg-blue-50 border-blue-100',
  },
  {
    tipo: 'vista_gps_estado_camiones',
    titulo: 'Estado GPS de Camiones',
    descripcion: 'Última conexión y estado actual de los dispositivos GPS por camión.',
    filename: 'estado_gps_camiones.csv',
    icon: <Navigation size={22} />,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    tipo: 'vista_reporte_diario_recorridos',
    titulo: 'Reporte Diario de Recorridos',
    descripcion: 'Resumen diario de recorridos programados, en ruta, finalizados y cancelados.',
    filename: 'reporte_diario_recorridos.csv',
    icon: <FileText size={22} />,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    tipo: 'vista_domicilios_usuario',
    titulo: 'Domicilios de Usuarios',
    descripcion: 'Listado de domicilios registrados por los usuarios y configuración de notificaciones.',
    filename: 'domicilios_usuarios.csv',
    icon: <FileText size={22} />,
    color: 'text-orange-600 bg-orange-50 border-orange-100',
  },
  {
    tipo: 'vista_alertas_admin_pendientes',
    titulo: 'Alertas Pendientes',
    descripcion: 'Alertas administrativas pendientes de revisión.',
    filename: 'alertas_pendientes.csv',
    icon: <Truck size={22} />,
    color: 'text-red-600 bg-red-50 border-red-100',
  },
];

function downloadCsv(tipo: string, filename: string, setLoading: (v: boolean) => void) {
  setLoading(true);
  fetch(`/api/admin/reportes?tipo=${encodeURIComponent(tipo)}&formato=csv`, {
    credentials: 'same-origin',
  })
    .then(async (res) => {
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((err) => {
      console.error('[ReportesPage] Error descargando CSV:', err);
      alert(`Error al descargar el reporte: ${err.message}`);
    })
    .finally(() => setLoading(false));
}

export default function ReportesPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleDescargar = (r: ReporteTipo) => {
    if (loading[r.tipo]) return;
    downloadCsv(
      r.tipo,
      r.filename,
      (v) => setLoading((prev) => ({ ...prev, [r.tipo]: v })),
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--rc-blue-800)]">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Descarga los datos del sistema en formato CSV listo para Excel.
        </p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTES.map((r) => (
          <div
            key={r.tipo}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4"
          >
            {/* Icono + título */}
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${r.color} shrink-0`}>
                {r.icon}
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--rc-blue-800)]">{r.titulo}</h2>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.descripcion}</p>
              </div>
            </div>

            {/* Botón descargar */}
            <button
              onClick={() => handleDescargar(r)}
              disabled={!!loading[r.tipo]}
              className="mt-auto flex items-center justify-center gap-2 w-full
                         bg-[var(--rc-blue-600)] hover:bg-[var(--rc-blue-700)]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         text-white text-sm font-medium px-4 py-2.5 rounded-xl
                         transition-colors shadow-sm"
            >
              {loading[r.tipo] ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <Download size={15} />
                  Descargar reporte
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Nota al pie */}
      <p className="mt-6 text-xs text-gray-400 text-center">
        Los archivos CSV están codificados en UTF-8 con BOM para compatibilidad con Microsoft Excel.
      </p>
    </div>
  );
}
