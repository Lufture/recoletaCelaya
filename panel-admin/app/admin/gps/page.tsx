import PageHeader from '@/components/admin/PageHeader';

const GPS_ESTADO = [
  { id:'1', camion:'CAM-101', dispositivo:'GPS principal',   fuente:'gps_camion_api',    estado:'online',      minutos:0.5,  prioridad:1, ultima:'hace 30 s' },
  { id:'2', camion:'CAM-102', dispositivo:'GPS principal',   fuente:'gps_camion_api',    estado:'online',      minutos:1.2,  prioridad:1, ultima:'hace 1 min' },
  { id:'3', camion:'CAM-103', dispositivo:'GPS principal',   fuente:'app_chofer',        estado:'offline',     minutos:45.0, prioridad:2, ultima:'hace 45 min' },
  { id:'4', camion:'CAM-104', dispositivo:'GPS principal',   fuente:'gps_camion_api',    estado:'online',      minutos:0.8,  prioridad:1, ultima:'hace 48 s' },
  { id:'5', camion:'CAM-105', dispositivo:'GPS mantenimiento',fuente:'manual',           estado:'desconocido', minutos:null, prioridad:3, ultima:'—' },
  { id:'6', camion:'CAM-106', dispositivo:'GPS principal',   fuente:'gps_camion_propio', estado:'online',      minutos:2.1,  prioridad:1, ultima:'hace 2 min' },
  { id:'7', camion:'CAM-107', dispositivo:'GPS principal',   fuente:'gps_camion_api',    estado:'online',      minutos:1.5,  prioridad:1, ultima:'hace 1 min' },
  { id:'8', camion:'CAM-108', dispositivo:'GPS principal',   fuente:'app_chofer',        estado:'sin_senal',   minutos:18.3, prioridad:2, ultima:'hace 18 min' },
  { id:'9', camion:'CAM-109', dispositivo:'GPS batería',     fuente:'gps_camion_propio', estado:'bateria_baja',minutos:5.0,  prioridad:2, ultima:'hace 5 min' },
  { id:'10',camion:'CAM-110', dispositivo:'—',               fuente:'—',                 estado:'desconocido', minutos:null, prioridad:3, ultima:'—' },
];

const ESTADO_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  online:       { badge: 'badge-green',  dot: '#10b981', label: 'Online'       },
  offline:      { badge: 'badge-red',    dot: '#ef4444', label: 'Offline'      },
  sin_senal:    { badge: 'badge-amber',  dot: '#f59e0b', label: 'Sin señal'    },
  bateria_baja: { badge: 'badge-amber',  dot: '#f59e0b', label: 'Batería baja' },
  estatico:     { badge: 'badge-blue',   dot: '#3b82f6', label: 'Estático'     },
  desconocido:  { badge: 'badge-slate',  dot: '#94a3b8', label: 'Desconocido'  },
};

const online    = GPS_ESTADO.filter(g => g.estado === 'online').length;
const offline   = GPS_ESTADO.filter(g => g.estado === 'offline').length;
const sinSenal  = GPS_ESTADO.filter(g => ['sin_senal','bateria_baja'].includes(g.estado)).length;

export default function GpsPage() {
  return (
    <>
      <PageHeader
        title="GPS"
        description="Estado de dispositivos GPS por camión"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label:'Online',         value: online,   color:'var(--rc-emerald-600)', bg:'var(--rc-emerald-50)' },
          { label:'Con problemas',  value: sinSenal, color:'#d97706',               bg:'var(--rc-amber-50)'   },
          { label:'Offline',        value: offline,  color:'var(--rc-red-500)',      bg:'var(--rc-red-50)'     },
        ].map((s) => (
          <div key={s.label} className="card py-4" style={{ background: s.bg, border: 'none' }}>
            <p className="text-xs font-medium mb-1" style={{ color: s.color }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.7 }}>camiones</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="select text-sm">
          <option value="">Todo estado GPS</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="sin_senal">Sin señal</option>
          <option value="bateria_baja">Batería baja</option>
        </select>
        <select className="select text-sm">
          <option value="">Fuente</option>
          <option value="gps_camion_api">GPS API camión</option>
          <option value="gps_camion_propio">GPS propio</option>
          <option value="app_chofer">App chofer</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Camión</th>
                <th>Dispositivo</th>
                <th>Fuente activa</th>
                <th>Prioridad</th>
                <th>Estado GPS</th>
                <th>Sin señal</th>
                <th>Última conexión</th>
              </tr>
            </thead>
            <tbody>
              {GPS_ESTADO.map((g) => {
                const cfg = ESTADO_CONFIG[g.estado] ?? ESTADO_CONFIG.desconocido;
                return (
                  <tr key={g.id}>
                    <td className="font-mono font-semibold text-[var(--rc-slate-700)]">{g.camion}</td>
                    <td className="text-[var(--rc-slate-600)] text-sm">{g.dispositivo}</td>
                    <td>
                      <span className="badge badge-slate text-[10px]">{g.fuente.replace(/_/g,' ')}</span>
                    </td>
                    <td className="text-center text-[var(--rc-slate-500)]">{g.prioridad}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                    </td>
                    <td>
                      {g.minutos != null
                        ? <span className={`tabular-nums text-sm font-medium ${g.minutos > 10 ? 'text-[var(--rc-red-500)]' : 'text-[var(--rc-slate-600)]'}`}>
                            {g.minutos.toFixed(1)} min
                          </span>
                        : <span className="text-[var(--rc-slate-300)]">—</span>}
                    </td>
                    <td className="text-[var(--rc-slate-400)] text-xs">{g.ultima}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--rc-slate-500)]">Mostrando 1–10 de 10 dispositivos</p>
          <p className="text-xs text-[var(--rc-slate-400)]">Actualizado en tiempo real · GET /api/admin/gps/estado</p>
        </div>
      </div>
    </>
  );
}
