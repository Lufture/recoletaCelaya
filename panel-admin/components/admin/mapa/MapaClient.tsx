'use client';

/**
 * MapaClient
 * ----------
 * Client Component responsable de:
 *  1. Suscribirse a Supabase Realtime vía useRealtimeGps()
 *  2. Montar el mapa Leaflet con ssr:false (Leaflet requiere window/document)
 *
 * El dynamic() DEBE estar al nivel del módulo (no dentro de la función)
 * para que Next.js pueda hacer code-splitting correctamente.
 */

import dynamic from 'next/dynamic';
import { useGpsCarrito } from '@/hooks/useGpsCarrito';

// Leaflet sólo puede correr en el cliente — ssr: false lo garantiza.
// La opción `ssr: false` sólo funciona en Client Components (este archivo).
const DynamicMapaLeaflet = dynamic(
  () => import('./MapaLeaflet'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--rc-blue-600)] border-t-transparent animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Cargando mapa…</p>
      </div>
    ),
  }
);

export default function MapaClient() {
  const { ubicaciones, status } = useGpsCarrito();

  return (
    <DynamicMapaLeaflet
      ubicaciones={ubicaciones}
      status={status}
    />
  );
}
