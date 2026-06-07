'use client';

/**
 * MiniMapaClient
 * ──────────────
 * Envoltorio de carga dinámica (ssr: false) para MiniMapaLeaflet.
 * Listo para colocarse dentro de cualquier contenedor con altura definida.
 */

import dynamic from 'next/dynamic';

const DynamicMiniMapaLeaflet = dynamic(
  () => import('./MiniMapaLeaflet'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-[var(--rc-blue-600)] border-t-transparent animate-spin" />
      </div>
    ),
  }
);

interface Props {
  camionId?: string | null;
}

export default function MiniMapaClient({ camionId }: Props) {
  return <DynamicMiniMapaLeaflet camionId={camionId} />;
}
