'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Swagger UI necesita acceso a window/document, asA- que desactivamos SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerUIViewer({ url }: { url: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 min-h-[80vh] overflow-hidden">
      <SwaggerUI url={url} />
    </div>
  );
}
