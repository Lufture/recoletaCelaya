import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/reportes?tipo=X&formato=csv
 *
 * Tipos soportados:
 *   colonias            → tabla colonias
 *   rutas               → rutas + colonias vinculadas + vehículos activos
 *   reportes_ciudadanos → tabla reportes_ciudadanos (con colonia)
 *   reportes_chofer     → tabla reportes_chofer
 *   gps_carrito         → últimas 500 entradas de gps_carrito
 *
 * Si formato=csv (o no se especifica) devuelve text/csv con Content-Disposition.
 * Si formato=json devuelve JSON normal.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tipo    = searchParams.get('tipo') ?? '';
  const formato = searchParams.get('formato') ?? 'csv';

  const supabase = createAdminClient();

  try {
    let headers: string[] = [];
    let rows: string[][]   = [];
    let filename = 'reporte.csv';

    // ── Vistas Soportadas ────────────────────────────────────────────────
    const VISTAS_SOPORTADAS = [
      'vista_publica_colonias_horarios',
      'vista_recorridos_activos',
      'vista_gps_estado_camiones',
      'vista_reporte_diario_recorridos',
      'vista_domicilios_usuario',
      'vista_alertas_admin_pendientes'
    ];

    if (!VISTAS_SOPORTADAS.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo no soportado: "${tipo}". Las opciones válidas son: ${VISTAS_SOPORTADAS.join(', ')}` },
        { status: 400 },
      );
    }

    // Set filename based on view name
    filename = `${tipo.replace('vista_', '')}.csv`;
    
    // Fetch directly from the view
    const { data, error } = await supabase
      .from(tipo)
      .select('*')
      .limit(2000); // Limit to 2000 rows to prevent overwhelming the server memory

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data && data.length > 0) {
      // Dynamically generate headers from the first row's keys
      headers = Object.keys(data[0]);
      
      // Map data to rows
      rows = data.map((row: any) => 
        headers.map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          
          // Basic date detection (if the string looks like an ISO date)
          if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return new Date(val).toLocaleString('es-MX');
          }
          
          return String(val);
        })
      );
    } else {
      headers = ['Sin datos'];
      rows = [];
    }

    // ── Serializar a CSV ────────────────────────────────────────────────
    if (formato === 'json') {
      return NextResponse.json({ headers, rows, total: rows.length });
    }

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csvLines = [
      headers.map(escape).join(','),
      ...rows.map((row) => row.map(escape).join(',')),
    ];
    const csv = '﻿' + csvLines.join('\r\n'); // BOM for Excel UTF-8

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    });

  } catch (err: any) {
    console.error('[/api/admin/reportes] Error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
