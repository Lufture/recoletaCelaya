'use client';

import dynamic from 'next/dynamic';

const DynamicMiniMapaDemoRutaLeaflet = dynamic(
  () => import('./MiniMapaDemoRutaLeaflet'),
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
  routeId: string;
}

export default function MiniMapaDemoRutaClient({ routeId }: Props) {
  return <DynamicMiniMapaDemoRutaLeaflet routeId={routeId} />;
}
