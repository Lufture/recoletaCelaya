'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@/lib/supabase/client';
import type { UbicacionActual } from '@/lib/types/database';
import type { GpsConnectionStatus } from '@/hooks/useGpsCarrito';

// ── Trail point from gps_carrito ───────────────────────────────────────────
type TrailPoint = {
  id: string;
  lat: number;
  lng: number;
  camion_id: string | null;
  creado_en: string;
};

// ── Operational status display labels ────────────────────────────────────
const ESTADO_LABEL: Record<string, string> = {
  en_ruta:    'Operando',
  pausado:    'Pausado',
  programado: 'Programado',
  finalizado: 'Finalizado',
  cancelado:  'Cancelado',
};

// GPS is considered stale after 5 minutes without an update
const STALE_GPS_MS = 5 * 60 * 1000;

// Trail window: draw last 6 hours of movement, max 500 rows to limit data transfer
const TRAIL_HOURS    = 6;
const TRAIL_MAX_ROWS = 500;
// Polling interval for trail updates (ms)
const POLL_TRAIL_MS  = 15_000;

// Polyline color palette — one colour per camion_id (cycles)
const TRAIL_COLORS = ['#0f2a71', '#00897b', '#7a1528', '#f59e0b', '#6366f1', '#0ea5e9'];

// ── Geographic constraints: Celaya, Guanajuato ────────────────────────────
const CELAYA_CENTER: [number, number] = [20.5223, -100.8122];
const CELAYA_BOUNDS: [[number, number], [number, number]] = [
  [20.4100, -100.9500],
  [20.6300, -100.6700],
];

// ── Truck marker icon ──────────────────────────────────────────────────────
function buildTruckIcon(estado: string | undefined, stale: boolean): L.DivIcon {
  const color =
    stale                 ? '#94a3b8' :
    estado === 'en_ruta'  ? '#10b981' :
    estado === 'pausado'  ? '#f59e0b' :
    '#64748b';

  return L.divIcon({
    html: `<div style="
      width:16px;height:16px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 1px 5px rgba(0,0,0,.4)
    "></div>`,
    className: '',
    iconSize:    [16, 16],
    iconAnchor:  [8, 8],
    popupAnchor: [0, -12],
  });
}

function buildPopup(
  u: UbicacionActual,
  camionClave: string | undefined,
  recorridoEstado: string | undefined,
): string {
  const hora = new Date(u.actualizado_en).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const stale = Date.now() - new Date(u.actualizado_en).getTime() > STALE_GPS_MS;
  const estadoLabel = recorridoEstado ? (ESTADO_LABEL[recorridoEstado] ?? recorridoEstado) : null;
  const estadoColor =
    recorridoEstado === 'en_ruta' ? '#059669' :
    recorridoEstado === 'pausado' ? '#d97706' :
    '#475569';

  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;min-width:175px;line-height:1.7">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px">🚛 ${camionClave ?? 'Carrito GPS'}</div>
      ${estadoLabel
        ? `<div>Estado: <b style="color:${estadoColor}">${estadoLabel}</b></div>`
        : ''}
      ${u.velocidad_kmh != null
        ? `<div>Velocidad: <b>${u.velocidad_kmh} km/h</b></div>`
        : ''}
      ${u.fuente
        ? `<div style="color:#64748b;font-size:11px">${u.fuente.replace(/_/g, ' ')}</div>`
        : ''}
      <div style="margin-top:3px;font-size:11px;color:${stale ? '#ef4444' : '#64748b'}">
        ${stale ? '⚠️ Sin señal GPS reciente &nbsp;·&nbsp; ' : ''}${hora}
      </div>
    </div>
  `;
}

interface MapaLeafletProps {
  ubicaciones: UbicacionActual[];
  status: GpsConnectionStatus;
}

export default function MapaLeaflet({ ubicaciones, status }: MapaLeafletProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Map<string, L.Marker>>(new Map());
  const polylinesRef = useRef<L.Polyline[]>([]);

  const [trails,        setTrails]        = useState<TrailPoint[]>([]);
  // 'none'=sin datos, 'stale'=datos históricos (fallback), 'live'=datos recientes
  const [mapDataStatus, setMapDataStatus] = useState<'none' | 'stale' | 'live'>('none');
  const [camionesMap,   setCamionesMap]   = useState<Record<string, string>>({});
  const [recorridosMap, setRecorridosMap] = useState<Record<string, string>>({});

  // ── Initialize map (once) ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CELAYA_CENTER,
      zoom: 13,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: CELAYA_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ── Load lookup data once (camiones + recorridos for popup labels) ───
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const cargarLookups = async () => {
      const { data: camionesData } = await supabase
        .from('camiones')
        .select('id, clave');
      if (mounted && camionesData) {
        const m: Record<string, string> = {};
        camionesData.forEach((c) => { m[c.id] = c.clave; });
        setCamionesMap(m);
      }

      const { data: recorridos } = await supabase
        .from('recorridos')
        .select('camion_id, estado')
        .in('estado', ['en_ruta', 'pausado', 'programado']);
      if (mounted && recorridos) {
        const m: Record<string, string> = {};
        recorridos.forEach((r) => { if (r.camion_id) m[r.camion_id] = r.estado; });
        setRecorridosMap(m);
      }
    };

    cargarLookups();
    return () => { mounted = false; };
  }, []);

  // ── Poll gps_carrito trails every POLL_TRAIL_MS ───────────────────────
  // Usa /api/admin/gps-carrito (createAdminClient) para evitar bloqueos RLS.
  // Fallback: si no hay datos en las últimas TRAIL_HOURS h, carga el historial
  // más reciente disponible y marca mapDataStatus='stale'.
  useEffect(() => {
    let mounted = true;

    const cargarTrail = async () => {
      const desde = new Date(Date.now() - TRAIL_HOURS * 60 * 60 * 1000).toISOString();

      // ── Intento 1: últimas 6 horas ─────────────────────────────────
      let res  = await fetch(
        `/api/admin/gps-carrito?todos=true&desde=${encodeURIComponent(desde)}&limit=${TRAIL_MAX_ROWS}`,
        { credentials: 'same-origin' },
      );
      let json = await res.json();
      let rows = (json.data ?? []) as TrailPoint[];
      let usedFallback = false;

      // ── Intento 2: sin filtro de tiempo (últimos disponibles) ──────
      if (rows.length === 0) {
        res  = await fetch(
          `/api/admin/gps-carrito?todos=true&limit=${TRAIL_MAX_ROWS}`,
          { credentials: 'same-origin' },
        );
        json = await res.json();
        rows = (json.data ?? []) as TrailPoint[];
        usedFallback = true;
      }

      // API devuelve DESC → invertir para trail ASC
      rows = [...rows].reverse();

      // ── DEBUG (quitar después de confirmar datos) ─────────────────
      if (rows.length > 0) {
        const ms  = rows.map((r) => new Date(r.creado_en).getTime());
        const ids = new Set(rows.map((r) => r.camion_id ?? '__null__'));
        console.log(
          `[MapaLeaflet] Trail ${usedFallback ? '(FALLBACK)' : '(reciente)'}:`,
          rows.length, 'pts |',
          ids.size, 'camiones |',
          new Date(Math.min(...ms)).toLocaleString('es-MX'),
          '→', new Date(Math.max(...ms)).toLocaleString('es-MX'),
        );
      } else {
        console.log('[MapaLeaflet] Trail: 0 puntos en gps_carrito.');
      }
      // ── /DEBUG ────────────────────────────────────────────────────

      if (!mounted) return;
      setTrails(rows);
      setMapDataStatus(
        rows.length === 0  ? 'none'  :
        usedFallback       ? 'stale' :
                             'live',
      );
    };

    cargarTrail();
    const timer = setInterval(cargarTrail, POLL_TRAIL_MS);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // ── Draw trail polylines whenever trail data loads ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.remove());
    polylinesRef.current = [];

    if (trails.length === 0) return;

    // Group points by camion_id (null camiones share key "__sin_camion__")
    const grouped = new Map<string, [number, number][]>();
    for (const pt of trails) {
      const key = pt.camion_id ?? '__sin_camion__';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push([pt.lat, pt.lng]);
    }

    // DEBUG — quitar después de confirmar datos ▼
    console.log('[MapaLeaflet] Dibujando:', trails.length, 'pts en', grouped.size, 'grupos de camion.');
    // DEBUG ▲

    const allBoundsPoints: [number, number][] = [];
    let colorIdx = 0;

    for (const [camionId, points] of grouped) {
      if (points.length < 2) continue; // single point → only marker, no line

      const color = TRAIL_COLORS[colorIdx++ % TRAIL_COLORS.length];
      const clave = camionId === '__sin_camion__'
        ? 'Carrito sin ID'
        : (camionesMap[camionId] ?? camionId.slice(0, 8));

      const polyline = L.polyline(points, {
        color,
        weight: 3,
        opacity: 0.7,
        dashArray: '7 4',
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:12px">
            <b style="font-size:13px">🛣️ ${clave}</b>
            <div style="color:#666;margin-top:2px">${points.length} puntos · últimas ${TRAIL_HOURS}h</div>
          </div>`,
          { maxWidth: 200 }
        );
      polylinesRef.current.push(polyline);
      allBoundsPoints.push(...points);
    }

    // DEBUG — quitar después de confirmar datos ▼
    console.log('[MapaLeaflet] Polilíneas:', polylinesRef.current.length, '| bounds pts:', allBoundsPoints.length);
    // DEBUG ▲

    // Fit map to trail extent on first real data load
    if (allBoundsPoints.length >= 2) {
      try {
        map.fitBounds(allBoundsPoints as L.LatLngBoundsExpression, {
          padding: [24, 24],
          maxZoom: 15,
        });
      } catch { /* ignore degenerate bounds */ }
    }
  }, [trails, camionesMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync markers whenever ubicaciones OR lookup maps change ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;
    const activeIds = new Set<string>();
    // DEBUG — quitar después de confirmar datos ▼
    console.log('[MapaLeaflet] Sync marcadores:', ubicaciones.length, 'ubics activas');
    // DEBUG ▲

    for (const u of ubicaciones) {
      activeIds.add(u.id);
      const latlng: [number, number] = [u.latitud, u.longitud];

      const camionClave     = camionesMap[u.camion_id];
      const recorridoEstado = recorridosMap[u.camion_id];
      const stale = Date.now() - new Date(u.actualizado_en).getTime() > STALE_GPS_MS;

      const popup = buildPopup(u, camionClave, recorridoEstado);
      const icon  = buildTruckIcon(recorridoEstado, stale);

      if (markers.has(u.id)) {
        const marker = markers.get(u.id)!;
        marker.setLatLng(latlng);
        marker.setIcon(icon);
        marker.setPopupContent(popup);
      } else {
        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 230 });
        markers.set(u.id, marker);
      }
    }

    // Remove markers for trucks no longer in ubicaciones
    markers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    });
  }, [ubicaciones, camionesMap, recorridosMap]);

  return (
    <div className="relative w-full h-full">
      {/* ── Status badge ───────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5
                        bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Sin conexión GPS
        </div>
      )}
      {status === 'connecting' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5
                        bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Cargando GPS…
        </div>
      )}
      {status === 'connected' && mapDataStatus === 'none' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]
                        bg-white/90 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border">
          Sin datos GPS disponibles
        </div>
      )}
      {status === 'connected' && mapDataStatus === 'stale' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5
                        bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Mostrando último recorrido registrado
        </div>
      )}

      {/* ── Leaflet container ─────────────────────────────────────────── */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
