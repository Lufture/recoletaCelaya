'use client';

/**
 * useGpsCarrito
 * ─────────────
 * Fuente de datos GPS para el mapa del dashboard.
 * Llama a /api/admin/gps-carrito (usa createAdminClient en el servidor),
 * evitando bloqueos de RLS sobre gps_carrito desde el cliente.
 * Polling cada 30 s.
 */

import { useEffect, useState } from 'react';
import type { UbicacionActual, FuenteUbicacion } from '@/lib/types/database';

export type GpsConnectionStatus = 'connecting' | 'connected' | 'error';

const POLL_INTERVAL_MS = 30_000;

interface GpsCarritoApiRow {
  id: string;
  lat: number;
  lng: number;
  speed: number | null;
  camion_id: string | null;
  fuente: string | null;
  creado_en: string;
}

function toUbicacion(row: GpsCarritoApiRow): UbicacionActual {
  return {
    id: row.id,
    camion_id: row.camion_id ?? '',
    recorrido_id: null,
    dispositivo_id: null,
    fuente: (row.fuente ?? 'gps_camion_propio') as FuenteUbicacion,
    latitud: row.lat,
    longitud: row.lng,
    velocidad_kmh: row.speed ?? null,
    direccion_grados: null,
    position_id: null,
    timestamp_origen: null,
    actualizado_en: row.creado_en,
  };
}

/**
 * Fetches via /api/admin/gps-carrito (no params) → latest pos per camion_id.
 * Server-side uses createAdminClient() so RLS on gps_carrito doesn't block reads.
 */
async function fetchLatestPerCamion(): Promise<UbicacionActual[]> {
  const res = await fetch('/api/admin/gps-carrito', { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`GPS API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  const rows = (json.data ?? []) as GpsCarritoApiRow[];

  // DEBUG — quitar después de confirmar datos ▼
  console.log(
    '[useGpsCarrito] Marcadores recibidos:', rows.length,
    rows.length ? `| más reciente: ${rows[0]?.creado_en}` : '(tabla vacía o sin acceso)',
  );
  // DEBUG ▲

  return rows.map(toUbicacion);
}

export function useGpsCarrito() {
  const [ubicaciones, setUbicaciones] = useState<UbicacionActual[]>([]);
  const [status, setStatus] = useState<GpsConnectionStatus>('connecting');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await fetchLatestPerCamion();
        if (!mounted) return;
        setUbicaciones(result);
        setStatus('connected');
      } catch (err) {
        console.error('[useGpsCarrito] Error al cargar posiciones:', err);
        if (mounted) setStatus('error');
      }
    };

    load();
    const timer = setInterval(() => { if (mounted) load(); }, POLL_INTERVAL_MS);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  return { ubicaciones, status };
}
