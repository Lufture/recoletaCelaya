'use client';

/**
 * GpsCarritoTable
 * ───────────────
 * Tabla de auditoría / demo que muestra los últimos registros de gps_carrito.
 * Consume /api/admin/gps-carrito?todos=true&limit=15 (createAdminClient,
 * bypassa RLS). Auto-refresco cada 15 s + botón manual.
 *
 * Componente aislado: no afecta rutas, mapa principal ni useGpsCarrito.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';

const POLL_MS = 15_000;

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface GpsRow {
  id: string;
  lat: number;
  lng: number;
  speed: number | null;
  altitude: number | null;
  satellites: number | null;
  camion_id: string | null;
  fuente: string | null;
  creado_en: string;
}

type LoadState = 'idle' | 'loading' | 'error' | 'ok';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Calcula el estado del dato según antigüedad del creado_en. */
function calcEstado(creado_en: string): { label: string; badgeClass: string } {
  if (!creado_en) return { label: 'Sin fecha', badgeClass: 'badge-amber' };
  const diff = Date.now() - new Date(creado_en).getTime();
  if (isNaN(diff))            return { label: 'Sin fecha', badgeClass: 'badge-amber' };
  if (diff < 5 * 60 * 1000)  return { label: 'En vivo',   badgeClass: 'badge-green'  };
  if (diff < 60 * 60 * 1000) return { label: 'Reciente',  badgeClass: 'badge-blue'   };
  return                             { label: 'Histórico', badgeClass: 'badge-slate'  };
}

const GPS_DISPLAY_LIMIT = 15;

async function fetchGpsRows(): Promise<GpsRow[]> {
  const res = await fetch(
    `/api/admin/gps-carrito?todos=true&limit=${GPS_DISPLAY_LIMIT}`,
    { credentials: 'same-origin' },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  // Respuesta envuelta en { data: [...], pagination: {...} }
  // slice(0, LIMIT) como defensa extra por si el endpoint devuelve más
  return ((json.data ?? []) as GpsRow[]).slice(0, GPS_DISPLAY_LIMIT);
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function GpsCarritoTable() {
  const [rows,        setRows]        = useState<GpsRow[]>([]);
  const [loadState,   setLoadState]   = useState<LoadState>('idle');
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [spinning,    setSpinning]    = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (manual = false) => {
    if (manual) setSpinning(true);
    setLoadState('loading');
    setErrorMsg(null);

    try {
      const data = await fetchGpsRows();
      if (!mountedRef.current) return;

      // DEBUG — quitar después de confirmar datos ▼
      console.log('[GpsCarritoTable] Registros recibidos:', data.length);
      if (data.length > 0) {
        console.log('[GpsCarritoTable] Más reciente:', data[0].creado_en);
        console.log('[GpsCarritoTable] Más antiguo: ', data[data.length - 1].creado_en);
      }
      // DEBUG ▲

      setRows(data);
      setLoadState('ok');
      setLastUpdated(new Date());
    } catch (e) {
      if (!mountedRef.current) return;
      setErrorMsg(e instanceof Error ? e.message : 'Error desconocido');
      setLoadState('error');
    } finally {
      if (mountedRef.current) setSpinning(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const t = setInterval(() => load(), POLL_MS);
    return () => { mountedRef.current = false; clearInterval(t); };
  }, [load]);

  return (
    <div className="pb-4">

      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--rc-blue-800)]">
            Actividad GPS de carritos
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Últimos registros recibidos desde <code className="font-mono">gps_carrito</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && loadState !== 'loading' && (
            <span className="text-xs text-gray-400">
              {lastUpdated.toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={loadState === 'loading'}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg
                       text-xs font-medium text-gray-600 hover:bg-gray-50
                       disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Tarjeta de tabla ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Cargando (primera vez, sin datos previos) */}
        {loadState === 'loading' && rows.length === 0 && (
          <div className="py-10 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-[var(--rc-blue-600)] border-t-transparent animate-spin" />
            Cargando registros GPS…
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <div className="py-10 flex flex-col items-center gap-2 text-sm text-red-600">
            <MapPin size={24} className="text-red-400" />
            <span>Error al consultar GPS: <b>{errorMsg}</b></span>
            <button
              onClick={() => load(true)}
              className="text-xs text-[var(--rc-blue-600)] underline mt-1"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sin registros */}
        {loadState === 'ok' && rows.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">
            No hay registros GPS disponibles.
          </div>
        )}

        {/* Tabla — altura máxima para no comerse el espacio de la tabla de rutas */}
        {rows.length > 0 && (
          <div className="max-h-[420px] overflow-y-auto">
          <div className="overflow-x-auto">
            {/* min-w-[900px]: garantiza espacio para 9 cols sin romper el layout padre */}
            <table className="min-w-[900px] w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3">Carrito</th>
                  <th className="px-5 py-3">Camion ID</th>
                  <th className="px-5 py-3">Latitud</th>
                  <th className="px-5 py-3">Longitud</th>
                  <th className="px-5 py-3">Velocidad</th>
                  <th className="px-5 py-3">Satélites</th>
                  <th className="px-5 py-3">Fuente</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const estado = calcEstado(row.creado_en);
                  const fecha  = row.creado_en
                    ? new Date(row.creado_en).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {/* Carrito */}
                      <td className="px-5 py-3 font-medium text-[var(--rc-blue-800)]">
                        {row.camion_id ? '🚛 Carrito GPS' : '📍 Sin camión'}
                      </td>

                      {/* Camion ID — truncado a 8 chars */}
                      <td className="px-5 py-3 font-mono text-gray-500">
                        {row.camion_id
                          ? <span title={row.camion_id}>{row.camion_id.slice(0, 8)}…</span>
                          : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Coordenadas */}
                      <td className="px-5 py-3 text-gray-700">{row.lat.toFixed(6)}</td>
                      <td className="px-5 py-3 text-gray-700">{row.lng.toFixed(6)}</td>

                      {/* Velocidad */}
                      <td className="px-5 py-3 text-gray-700">
                        {row.speed != null ? `${row.speed} km/h` : 'N/D'}
                      </td>

                      {/* Satélites */}
                      <td className="px-5 py-3 text-gray-700">
                        {row.satellites ?? 'N/D'}
                      </td>

                      {/* Fuente */}
                      <td className="px-5 py-3 text-gray-500">
                        {row.fuente ?? 'N/D'}
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-3 text-gray-500">{fecha}</td>

                      {/* Estado */}
                      <td className="px-5 py-3">
                        <span className={`badge ${estado.badgeClass}`}>
                          {estado.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Footer */}
        {rows.length > 0 && (
          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {rows.length} de los últimos {GPS_DISPLAY_LIMIT} registros · auto-refresco cada 15 s
            </span>
            {loadState === 'loading' && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-3 h-3 rounded-full border-[1.5px] border-gray-400 border-t-transparent animate-spin" />
                Actualizando…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
