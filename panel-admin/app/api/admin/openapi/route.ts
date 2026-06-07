import { type NextRequest } from 'next/server';
import { withAuth, jsonError } from '@/lib/api-helpers';
import fs from 'fs/promises';
import path from 'path';

// GET /api/admin/openapi
// Retorna el contenido del archivo openapi.yaml, protegido para administradores
export const GET = withAuth(async (_request, _context, _user) => {
  try {
    const filePath = path.join(process.cwd(), 'openapi.yaml');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error al leer openapi.yaml:', error);
    return jsonError('No se pudo leer el archivo de documentacion', 500);
  }
});
