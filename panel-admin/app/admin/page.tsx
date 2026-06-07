import { Map, Truck, Clock, AlertTriangle, ChevronRight, Activity, MapPin } from 'lucide-react';
import Link from 'next/link';
import MapaClient from '@/components/admin/mapa/MapaClient';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[var(--rc-blue-800)]">Resumen general</h1>
        <div className="text-sm text-gray-500">
          Última actualización: hace 2 minutos
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--rc-green-50)] flex items-center justify-center">
              <Map size={24} className="text-[var(--rc-green-600)]" />
            </div>
            <div className="text-[var(--rc-green-600)] flex items-center gap-1 text-sm font-semibold bg-[var(--rc-green-50)] px-2 py-1 rounded-md">
              <Activity size={14} /> +2 hoy
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--rc-blue-800)] mb-1">24</div>
          <div className="text-sm font-medium text-gray-500">Rutas Activas</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck size={24} className="text-[var(--rc-blue-600)]" />
            </div>
            <div className="text-[var(--rc-green-600)] flex items-center gap-1 text-sm font-semibold bg-[var(--rc-green-50)] px-2 py-1 rounded-md">
              <Activity size={14} /> 100%
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--rc-blue-800)] mb-1">18</div>
          <div className="text-sm font-medium text-gray-500">Camiones Operando</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Clock size={24} className="text-orange-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--rc-blue-800)] mb-1">3</div>
          <div className="text-sm font-medium text-gray-500">Alertas de retraso</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div className="text-red-500 flex items-center gap-1 text-sm font-semibold bg-red-50 px-2 py-1 rounded-md">
              +5 nuevos
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--rc-blue-800)] mb-1">12</div>
          <div className="text-sm font-medium text-gray-500">Reportes ciudadanos</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--rc-blue-800)]">Actividad de Recolección en Vivo</h2>
            <Link href="/admin/rutas" className="text-sm font-semibold text-[var(--rc-blue-600)] hover:text-[var(--rc-blue-800)] flex items-center gap-1">
              Ver detalle de rutas <ChevronRight size={16} />
            </Link>
          </div>
          {/* Live map — Leaflet + Supabase Realtime */}
          <div className="relative flex-1 min-h-[400px]">
            <MapaClient />
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[var(--rc-blue-800)]">Actividad Reciente</h2>
          </div>
          <div className="p-2">
            {[
              { title: "Ruta Zona Centro Completada", desc: "Camión 12 - Hace 15 min", icon: MapPin, color: "text-[var(--rc-green-600)]", bg: "bg-[var(--rc-green-50)]" },
              { title: "Retraso reportado", desc: "Ruta Sur - Camión 4 - Hace 32 min", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
              { title: "Nuevo reporte ciudadano", desc: "Contenedor lleno en Colonia Álamos", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
              { title: "Inicio de recorrido", desc: "Ruta Norte - Camión 8 - Hace 1 hora", icon: Truck, color: "text-[var(--rc-blue-600)]", bg: "bg-[var(--rc-blue-50)]" },
              { title: "Mantenimiento preventivo", desc: "Camión 3 - Programado para hoy", icon: Activity, color: "text-gray-500", bg: "bg-gray-100" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-b border-gray-50 last:border-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                  <item.icon size={18} className={item.color} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--rc-blue-800)]">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 mt-auto border-t border-gray-50 text-center">
            <button className="text-sm font-semibold text-[var(--rc-blue-600)] hover:text-[var(--rc-blue-800)]">
              Ver todo el historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
