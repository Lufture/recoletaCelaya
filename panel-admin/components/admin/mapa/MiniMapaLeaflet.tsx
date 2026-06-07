'use client';

/**
 * MiniMapaLeaflet
 * ───────────────
 * Mapa Leaflet compacto para el panel de detalle de ruta.
 * Fuente única: /api/admin/gps-carrito (usa createAdminClient server-side).
 *
 *   - Si se pasa camionId → filtra sólo ese camión.
 *   - Si camionId es null/undefined → muestra todos (fallback demo).
 *
 * Fallback automático: si no hay datos en las últimas TRAIL_HOURS,
 * carga el historial más reciente disponible.
 *
 * Estados internos que se muestran como overlay:
 *   loading          → spinner (mientras carga por primera vez)
 *   no-gps-data      → "No hay datos GPS disponibles para este camión."
 *   stale-gps-data   → banner ámbar "Mostrando último recorrido registrado."
 *   live-gps-data    → mapa normal, sin overlay
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CELAYA_CENTER: [number, number] = [20.5223, -100.8122];
const CELAYA_BOUNDS: [[number, number], [number, number]] = [
  [20.4100, -100.9500],
  [20.6300, -100.6700],
];
const TRAIL_HOURS = 6;
const TRAIL_MAX   = 500;
const POLL_MS     = 15_000;
const TRAIL_COLORS = ['#0f2a71', '#00897b', '#7a1528', '#f59e0b'];
const STALE_GPS_MS = 5 * 60 * 1000;

interface GpsCarritoRow {
  id: string;
  lat: number;
  lng: number;
  speed: number | null;
  camion_id: string | null;
  creado_en: string;
}

interface Props {
  /** Opcional: filtrar el mapa a un camión específico. null/undefined → todos. */
  camionId?: string | null;
}

export default function MiniMapaLeaflet({ camionId }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const mountedRef    = useRef(true);
  const hasFitBounds  = useRef(false);

  // Overlay message shown on top of the map
  const [overlayMsg, setOverlayMsg] = useState<string | null>(null);
  // 'loading' = initial, 'stale' = fallback data, 'live' = recent data, 'empty' = no data
  const [dataState, setDataState]   = useState<'loading' | 'empty' | 'stale' | 'live'>('loading');

  // ── Init map (once) ───────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    hasFitBounds.current = false;
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CELAYA_CENTER,
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: CELAYA_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const lg = L.layerGroup().addTo(map);
    mapRef.current        = map;
    layerGroupRef.current = lg;

    return () => {
      mountedRef.current = false;
      map.remove();
      mapRef.current        = null;
      layerGroupRef.current = null;
    };
  }, []);

  // ── Reset fitBounds flag when camionId changes ────────────────────────
  useEffect(() => {
    hasFitBounds.current = false;
    setDataState('loading');
  }, [camionId]);

  // ── Load + poll gps_carrito data ──────────────────────────────────────
  useEffect(() => {
    const render = async () => {
      const map = mapRef.current;
      const lg  = layerGroupRef.current;
      if (!map || !lg || !mountedRef.current) return;

      const desde = new Date(Date.now() - TRAIL_HOURS * 60 * 60 * 1000).toISOString();

      // ── Intento 1: últimas TRAIL_HOURS horas ─────────────────────────
      const url1 = camionId
        ? `/api/admin/gps-carrito?todos=true&camionId=${encodeURIComponent(camionId)}&desde=${encodeURIComponent(desde)}&limit=${TRAIL_MAX}`
        : `/api/admin/gps-carrito?todos=true&desde=${encodeURIComponent(desde)}&limit=${TRAIL_MAX}`;

      let res  = await fetch(url1, { credentials: 'same-origin' });
      let json = await res.json();
      let rows = (json.data ?? []) as GpsCarritoRow[];
      let usedFallback = false;

      // ── Intento 2: sin filtro de tiempo ──────────────────────────────
      if (rows.length === 0) {
        const url2 = camionId
          ? `/api/admin/gps-carrito?todos=true&camionId=${encodeURIComponent(camionId)}&limit=${TRAIL_MAX}`
          : `/api/admin/gps-carrito?todos=true&limit=${TRAIL_MAX}`;
        res  = await fetch(url2, { credentials: 'same-origin' });
        json = await res.json();
        rows = (json.data ?? []) as GpsCarritoRow[];
        usedFallback = true;
      }

      // API devuelve DESC → invertir para trail ASC
      rows = [...rows].reverse();

      // ── DEBUG (quitar después de confirmar datos) ─────────────────────
      const tag = camionId ? `camion:${camionId.slice(0, 8)}` : 'todos';
      console.log(`[MiniMapa(${tag})] ${usedFallback ? 'FALLBACK' : 'reciente'}: ${rows.length} pts`);
      // ── /DEBUG ────────────────────────────────────────────────────────

      if (!mountedRef.current) return;
      lg.clearLayers();

      if (rows.length === 0) {
        setDataState('empty');
        setOverlayMsg(
          camionId
            ? 'No hay datos GPS disponibles para este camión.'
            : 'Sin datos GPS disponibles.',
        );
        return;
      }

      setDataState(usedFallback ? 'stale' : 'live');
      setOverlayMsg(usedFallback ? 'Mostrando último recorrido registrado.' : null);

      // ── Agrupar por camion_id ─────────────────────────────────────────
      const grouped = new Map<string, GpsCarritoRow[]>();
      for (const row of rows) {
        const key = row.camion_id ?? '__sin_camion__';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(row);
      }

      const allBoundsPoints: [number, number][] = [];
      let colorIdx = 0;

      for (const [_key, pts] of grouped) {
        if (pts.length === 0) continue;
        const color   = TRAIL_COLORS[colorIdx++ % TRAIL_COLORS.length];
        const latLngs: [number, number][] = pts.map((p) => [p.lat, p.lng]);

        // Polilínea (sólo si ≥ 2 puntos)
        if (latLngs.length >= 2) {
          L.polyline(latLngs, {
            color, weight: 3, opacity: 0.75, dashArray: '6 3',
          }).addTo(lg);
          allBoundsPoints.push(...latLngs);
        }

        // Marcador = última posición
        const last  = pts[pts.length - 1];
        const stale = Date.now() - new Date(last.creado_en).getTime() > STALE_GPS_MS;
        const dotColor = stale ? '#94a3b8' : color;

        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:${dotColor};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
          className: '',
          iconSize:  [12, 12],
          iconAnchor:[6, 6],
        });

        const hora = new Date(last.creado_en).toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit',
        });

        L.marker([last.lat, last.lng], { icon })
          .bindPopup(
            `<div style="font-size:11px;font-family:system-ui">
              <b>🚛 GPS Carrito</b><br/>
              ${last.speed != null ? `${last.speed} km/h &nbsp;·&nbsp;` : ''}${hora}
              ${stale ? '<br/><span style="color:#ef4444">⚠️ Sin señal reciente</span>' : ''}
            </div>`,
            { maxWidth: 160 }
          )
          .addTo(lg);

        allBoundsPoints.push([last.lat, last.lng]);
      }

      // fitBounds sólo una vez por camionId
      if (!hasFitBounds.current && allBoundsPoints.length >= 2) {
        try {
          map.fitBounds(
            allBoundsPoints as L.LatLngBoundsExpression,
            { padding: [12, 12], maxZoom: 15 },
          );
          hasFitBounds.current = true;
        } catch { /* bounds degeneradas — ignorar */ }
      } else if (!hasFitBounds.current && allBoundsPoints.length === 1) {
        map.setView(allBoundsPoints[0], 15);
        hasFitBounds.current = true;
      }
    };

    render();
    const timer = setInterval(render, POLL_MS);
    return () => clearInterval(timer);
  }, [camionId]);

  return (
    <div className="relative w-full h-full">
      {/* Mapa Leaflet */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay: mensaje de estado sobre el mapa */}
      {dataState === 'empty' && overlayMsg && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-[500]">
          <p className="text-xs text-gray-500 font-medium text-center px-4">{overlayMsg}</p>
        </div>
      )}
      {dataState === 'stale' && overlayMsg && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[500]
                        flex items-center gap-1.5 bg-amber-50 border border-amber-200
                        text-amber-700 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm
                        whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          {overlayMsg}
        </div>
      )}
    </div>
  );
}
