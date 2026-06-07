'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Map, MoreVertical, X, Edit, Power, PowerOff, MapPin, Navigation, Circle } from 'lucide-react';
import MiniMapaClient from '@/components/admin/mapa/MiniMapaClient';
import MiniMapaDemoRutaClient from '@/components/admin/mapa/MiniMapaDemoRutaClient';
import GpsCarritoTable from '@/components/admin/gps/GpsCarritoTable';
import RutaModal from '@/components/admin/RutaModal';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Ruta {
  id:           string;
  route_id:     string;
  nombre:       string;
  descripcion:  string | null;
  estado:       string;
  color_mapa:   string | null;
  activo:       boolean;
  creado_en:    string;
  actualizado_en: string;
}

interface Posicion {
  id:                    string;
  position_id:           number;
  colonia_id:            string | null;
  latitud:               number | null;
  longitud:              number | null;
  es_base_salida:        boolean;
  es_retorno_base:       boolean;
  es_punto_proximidad:   boolean;
  descripcion:           string | null;
  colonias?:             { id: string; nombre: string; latitud: number | null; longitud: number | null; } | null;
}

interface ColoniaRuta {
  id:                   string;
  colonia_id:           string;
  horario_estimado:     string | null;
  hora_inicio_estimada: string | null;
  hora_fin_estimada:    string | null;
  colonias:             { nombre: string } | null;
}

// ── Helpers de color según estado ─────────────────────────────────────────────
type ColorKey = 'green' | 'gray' | 'blue' | 'orange' | 'red';

function estadoAColor(estado: string): ColorKey {
  if (estado === 'activa')     return 'green';
  if (estado === 'programada') return 'blue';
  if (estado === 'pausada')    return 'orange';
  if (estado === 'cancelada')  return 'red';
  return 'gray';
}

const COLOR_MAP: Record<ColorKey, { badge: string; dot: string; banner: string; bannerText: string }> = {
  green:  { badge: 'bg-[var(--rc-green-50)] text-[var(--rc-green-700)] border-[var(--rc-green-100)]',  dot: 'bg-[var(--rc-green-500)]',  banner: 'bg-[var(--rc-green-50)] border-[var(--rc-green-100)]',  bannerText: 'text-[var(--rc-green-800)]' },
  blue:   { badge: 'bg-blue-50 text-blue-700 border-blue-100',   dot: 'bg-blue-500',   banner: 'bg-blue-50 border-blue-100',   bannerText: 'text-blue-800' },
  gray:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',  dot: 'bg-gray-400',   banner: 'bg-gray-50 border-gray-200',   bannerText: 'text-gray-700' },
  orange: { badge: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', banner: 'bg-orange-50 border-orange-100', bannerText: 'text-orange-800' },
  red:    { badge: 'bg-red-50 text-red-700 border-red-100',      dot: 'bg-red-500',    banner: 'bg-red-50 border-red-100',     bannerText: 'text-red-800' },
};

const ESTADO_LABEL: Record<string, string> = {
  activa:     'Activa',
  programada: 'Programada',
  pausada:    'Pausada',
  finalizada: 'Finalizada',
  cancelada:  'Cancelada',
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function RutasPage() {
  // Lista de rutas
  const [rutas,       setRutas]       = useState<Ruta[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');

  // Ruta seleccionada (panel derecho)
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null);
  const [colonias,     setColonias]     = useState<ColoniaRuta[]>([]);
  const [loadingColonias, setLoadingColonias] = useState(false);

  // Posiciones de la ruta seleccionada
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [loadingPosiciones, setLoadingPosiciones] = useState(false);

  // Modal
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [rutaParaEditar, setRutaParaEditar] = useState<Ruta | null>(null);

  // ── Fetch rutas ─────────────────────────────────────────────────────────────
  const fetchRutas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);

      const res  = await fetch(`/api/admin/rutas?${params}`, { credentials: 'same-origin' });
      const json = await res.json();

      if (res.ok) {
        setRutas(json.data ?? []);
        setTotalPages(json.pagination?.totalPages ?? 1);
      }
    } catch (err) {
      console.error('[RutasPage] Error al cargar rutas:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchRutas, 300);
    return () => clearTimeout(t);
  }, [fetchRutas]);

  // ── Fetch colonias cuando cambia la ruta seleccionada ────────────────────────
  useEffect(() => {
    if (!selectedRuta) { setColonias([]); return; }
    let mounted = true;
    setLoadingColonias(true);
    fetch(`/api/admin/rutas/${selectedRuta.id}/colonias`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((json) => { if (mounted) setColonias((json.data ?? []) as ColoniaRuta[]); })
      .catch(() => { if (mounted) setColonias([]); })
      .finally(() => { if (mounted) setLoadingColonias(false); });
    return () => { mounted = false; };
  }, [selectedRuta?.id]);

  // ── Fetch posiciones cuando cambia la ruta seleccionada ──────────────────────
  useEffect(() => {
    if (!selectedRuta) { setPosiciones([]); return; }
    let mounted = true;
    setLoadingPosiciones(true);
    fetch(`/api/admin/rutas/${selectedRuta.id}/posiciones`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((json) => { if (mounted) setPosiciones((json.data ?? []) as Posicion[]); })
      .catch(() => { if (mounted) setPosiciones([]); })
      .finally(() => { if (mounted) setLoadingPosiciones(false); });
    return () => { mounted = false; };
  }, [selectedRuta?.id]);

  // ── Acciones ─────────────────────────────────────────────────────────────────
  const handleNuevaRuta = () => {
    setRutaParaEditar(null);
    setIsModalOpen(true);
  };

  const handleEditar = (ruta: Ruta, e: React.MouseEvent) => {
    e.stopPropagation();
    setRutaParaEditar(ruta);
    setIsModalOpen(true);
  };

  const handleToggleActivo = async (ruta: Ruta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`${ruta.activo ? 'Desactivar' : 'Activar'} la ruta ${ruta.route_id}?`)) return;
    try {
      await fetch(`/api/admin/rutas/${ruta.id}`, {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body:        JSON.stringify({ activo: !ruta.activo }),
      });
      // Si la ruta desactivada estaba seleccionada, deseleccionar
      if (selectedRuta?.id === ruta.id) setSelectedRuta(null);
      fetchRutas();
    } catch (err) {
      console.error('[RutasPage] Error al cambiar estado:', err);
    }
  };

  const handleSaveModal = () => {
    fetchRutas();
    // Si editamos la ruta actualmente seleccionada, refrescar su estado
    if (rutaParaEditar && selectedRuta?.id === rutaParaEditar.id) {
      setSelectedRuta(null);
    }
  };

  const colorKey = selectedRuta ? estadoAColor(selectedRuta.estado) : null;
  const c        = colorKey ? COLOR_MAP[colorKey] : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] xl:h-[calc(100vh-var(--topbar-height))] -mx-8 -my-6">

      {/* ── Panel izquierdo ────────────────────────────────────────────────── */}
      <div className="min-h-0 flex flex-col bg-gray-50/50 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--rc-blue-800)]">Rutas</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión y monitoreo de rutas de recolección</p>
          </div>
          <button
            onClick={handleNuevaRuta}
            className="flex items-center gap-2 bg-[var(--rc-blue-600)] hover:bg-[var(--rc-blue-700)] text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-900/10"
          >
            <Plus size={18} /> Nueva ruta
          </button>
        </div>

        <div className="space-y-8">

          {/* ── Sección 1: Tabla de rutas ──────────────────────────────────── */}
          <section>

            {/* Barra de búsqueda */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex items-center justify-between gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por ID o nombre…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rc-blue-500)]"
                />
              </div>
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--rc-blue-500)] border-t-transparent animate-spin shrink-0" />
              )}
            </div>

            {/* Tabla */}
            <div className="bg-white border border-gray-200 rounded-b-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Nombre / Zona</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Color</th>
                      <th className="px-6 py-3 w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!loading && rutas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                          No se encontraron rutas.{' '}
                          <button onClick={handleNuevaRuta} className="text-[var(--rc-blue-600)] underline">
                            Crear la primera
                          </button>
                        </td>
                      </tr>
                    )}
                    {rutas.map((ruta) => {
                      const isSelected = selectedRuta?.id === ruta.id;
                      const ck  = estadoAColor(ruta.estado);
                      const col = COLOR_MAP[ck];
                      return (
                        <tr
                          key={ruta.id}
                          onClick={() => setSelectedRuta(ruta)}
                          className={`transition-colors cursor-pointer relative ${
                            isSelected ? 'bg-[var(--rc-blue-50)]/50' : 'hover:bg-gray-50'
                          } ${!ruta.activo ? 'opacity-50' : ''}`}
                        >
                          <td className="px-6 py-4 font-semibold text-[var(--rc-blue-800)]">
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--rc-blue-600)] rounded-r-md" />
                            )}
                            {ruta.route_id}
                          </td>
                          <td className="px-6 py-4 text-gray-700 max-w-[220px] truncate">{ruta.nombre}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${col.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                              {ESTADO_LABEL[ruta.estado] ?? ruta.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="w-5 h-5 rounded-full border border-gray-200 shadow-sm"
                              style={{ background: ruta.color_mapa ?? '#94a3b8' }}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleEditar(ruta, e)}
                                className="p-1.5 text-gray-400 hover:text-[var(--rc-blue-600)] hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={(e) => handleToggleActivo(ruta, e)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  ruta.activo
                                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={ruta.activo ? 'Desactivar' : 'Activar'}
                              >
                                {ruta.activo ? <PowerOff size={15} /> : <Power size={15} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Página <b>{page}</b> de <b>{totalPages}</b></span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Sección 2: Actividad GPS (auditoría) ────────────────────────── */}
          <section>
            <GpsCarritoTable />
          </section>

        </div>
      </div>

      {/* ── Panel derecho ─────────────────────────────────────────────────── */}
      <div className="min-h-0 bg-white border-t xl:border-t-0 xl:border-l border-gray-200 flex flex-col overflow-y-auto shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] xl:z-10">

        {/* Header del panel */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[var(--rc-blue-800)] flex items-center gap-2">
              Detalle de Ruta
              {selectedRuta && (
                <span className="bg-[var(--rc-blue-50)] text-[var(--rc-blue-600)] px-2 py-0.5 rounded text-sm font-mono">
                  {selectedRuta.route_id}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedRuta ? selectedRuta.nombre : 'Sin ruta seleccionada'}
            </p>
          </div>
          {selectedRuta && (
            <button
              onClick={() => setSelectedRuta(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sin selección */}
        {!selectedRuta && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Map size={36} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-400">Selecciona una ruta para ver el detalle</p>
            <p className="text-xs text-gray-300">Haz clic en cualquier fila de la tabla</p>
          </div>
        )}

        {/* Con selección */}
        {selectedRuta && c && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

            {/* Banner de estado */}
            <div className={`border rounded-xl p-4 flex items-start gap-3 ${c.banner}`}>
              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${c.dot} ${
                selectedRuta.estado === 'activa' ? 'animate-pulse shadow-[0_0_0_4px_var(--rc-green-100)]' : ''
              }`} />
              <div>
                <h4 className={`text-sm font-bold ${c.bannerText}`}>
                  {ESTADO_LABEL[selectedRuta.estado] ?? selectedRuta.estado}
                </h4>
                <p className={`text-xs mt-0.5 ${c.bannerText} opacity-75`}>
                  {selectedRuta.activo ? 'Ruta habilitada' : 'Ruta desactivada'}
                </p>
              </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'ID de ruta',    value: selectedRuta.route_id },
                { label: 'Estado',        value: ESTADO_LABEL[selectedRuta.estado] ?? selectedRuta.estado },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <span className="text-xs text-gray-400 block mb-0.5">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--rc-blue-900)] font-mono">{item.value}</span>
                </div>
              ))}
            </div>

            {selectedRuta.descripcion && (
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <span className="text-xs text-gray-400 block mb-0.5">Descripción</span>
                <p className="text-sm text-gray-700">{selectedRuta.descripcion}</p>
              </div>
            )}

            <div className="h-px bg-gray-100 w-full" />

            {/* Mini Mapa */}
            <div>
              <h3 className="text-sm font-bold text-[var(--rc-blue-800)] mb-3 flex items-center gap-2">
                <Map size={16} /> Mapa del recorrido
              </h3>
              <div className="w-full h-44 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative">
                {['RT-001', 'RT-002'].includes(selectedRuta.route_id) ? (
                  <MiniMapaDemoRutaClient routeId={selectedRuta.route_id} />
                ) : (
                  <p className="text-xs text-gray-400 text-center px-4">
                    El mapa en tiempo real requiere un recorrido activo con camión asignado.
                  </p>
                )}
              </div>
            </div>

            {/* Puntos de la ruta */}
            <div>
              <h3 className="text-sm font-bold text-[var(--rc-blue-800)] mb-3 flex items-center gap-2">
                <Navigation size={16} /> Puntos de la ruta
              </h3>
              {loadingPosiciones ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <div className="w-3 h-3 rounded-full border-[1.5px] border-[var(--rc-blue-500)] border-t-transparent animate-spin" />
                  Cargando puntos…
                </div>
              ) : posiciones.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin puntos registrados para esta ruta.</p>
              ) : (
                <div className="relative">
                  {posiciones.map((pos, idx) => {
                    const isFirst = pos.es_base_salida;
                    const isLast  = pos.es_retorno_base;
                    const dotColor = isFirst ? 'bg-emerald-500' : isLast ? 'bg-red-500' : 'bg-blue-500';
                    const dotRing  = isFirst ? 'ring-emerald-100' : isLast ? 'ring-red-100' : 'ring-blue-100';
                    const label    = isFirst ? 'Inicio' : isLast ? 'Fin' : `Punto ${pos.position_id}`;
                    const isLastItem = idx === posiciones.length - 1;

                    return (
                      <div key={pos.id} className="flex gap-3 relative">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center w-5 shrink-0">
                          <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ${dotRing} z-10 mt-1 shrink-0`} />
                          {!isLastItem && (
                            <div className="w-0.5 flex-1 bg-gray-200 min-h-[24px]" />
                          )}
                        </div>
                        {/* Content */}
                        <div className={`flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 ${!isLastItem ? 'mb-1.5' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--rc-blue-800)]">
                              {pos.colonias ? pos.colonias.nombre : label}
                            </span>
                            {pos.descripcion && !pos.colonias && (
                              <span className="text-[10px] text-gray-400 ml-2 truncate max-w-[120px]">
                                {pos.descripcion}
                              </span>
                            )}
                            {pos.colonias && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ml-2 font-medium">
                                Colonia
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {pos.latitud && pos.longitud 
                              ? `${pos.latitud.toFixed(6)}, ${pos.longitud.toFixed(6)}`
                              : pos.colonias && pos.colonias.latitud && pos.colonias.longitud
                                ? `${pos.colonias.latitud.toFixed(6)}, ${pos.colonias.longitud.toFixed(6)}`
                                : 'Coordenadas no definidas'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Colonias */}
            <div>
              <h3 className="text-sm font-bold text-[var(--rc-blue-800)] mb-3 flex items-center gap-2">
                <MapPin size={16} /> Colonias de esta ruta
              </h3>
              {loadingColonias ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <div className="w-3 h-3 rounded-full border-[1.5px] border-[var(--rc-blue-500)] border-t-transparent animate-spin" />
                  Cargando colonias…
                </div>
              ) : colonias.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin colonias registradas para esta ruta.</p>
              ) : (
                <ul className="space-y-1.5">
                  {colonias.map((cr) => (
                    <li key={cr.id}
                        className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-[var(--rc-blue-800)]">
                        {cr.colonias?.nombre ?? '—'}
                      </span>
                      {cr.hora_inicio_estimada && cr.hora_fin_estimada && (
                        <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap ml-2">
                          {cr.hora_inicio_estimada.slice(0, 5)}–{cr.hora_fin_estimada.slice(0, 5)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-auto pt-2 flex gap-3">
              <button
                onClick={(e) => handleEditar(selectedRuta, e)}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--rc-blue-50)] text-[var(--rc-blue-700)] px-4 py-2.5 rounded-lg font-medium hover:bg-[var(--rc-blue-100)] transition-colors"
              >
                <Edit size={15} /> Editar
              </button>
              <button
                onClick={(e) => handleToggleActivo(selectedRuta, e)}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {selectedRuta.activo ? <PowerOff size={15} /> : <Power size={15} />}
                {selectedRuta.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Modal crear/editar ruta */}
      <RutaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        ruta={rutaParaEditar ?? undefined}
      />
    </div>
  );
}
