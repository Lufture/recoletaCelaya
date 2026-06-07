import PageHeader from '@/components/admin/PageHeader';
import SwaggerUIViewer from '@/components/admin/SwaggerUIViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenAPI Docs | Panel Admin',
  description: 'Documentación interactiva de la API',
};

export default function OpenApiPage() {
  return (
    <>
      <PageHeader
        title="Documentación API"
        description="Explora y prueba los endpoints del sistema (OpenAPI 3.0). Los endpoints protegidos requieren autenticación."
      />
      <SwaggerUIViewer url="/api/admin/openapi" />
    </>
  );
}
