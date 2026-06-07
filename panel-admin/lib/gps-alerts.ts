import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================
// GPS Alert Detection
// Se ejecuta cada vez que el carrito/camión envía una posición.
// ============================================================

const STATIC_THRESHOLD_METERS = 5;      // Distancia mínima para considerar "movimiento"
const STATIC_THRESHOLD_SECONDS = 15;    // Tiempo estático para generar alerta
const DISCONNECT_THRESHOLD_MINUTES = 2; // Tiempo sin señal para alerta de desconexión

/**
 * Calcula distancia en metros entre dos puntos (Haversine simplificado).
 */
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Radio de la tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verifica si ya existe una alerta activa (nueva/vista/en_revision) del mismo tipo
 * para el mismo camión, para evitar duplicados.
 */
async function alertaActivaExiste(
  supabase: ReturnType<typeof createAdminClient>,
  camionId: string,
  tipo: string
): Promise<boolean> {
  const { data } = await supabase
    .from('alertas_admin')
    .select('id')
    .eq('camion_id', camionId)
    .eq('tipo', tipo)
    .in('estado', ['nueva', 'vista', 'en_revision'])
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Llamar después de cada INSERT en gps_carrito.
 * Compara la posición actual contra la anterior y si el camión
 * lleva > 15s en el mismo lugar, crea una alerta gps_estatico.
 */
export async function checkStaticGps(
  camionId: string,
  lat: number,
  lng: number
): Promise<void> {
  const supabase = createAdminClient();

  // Obtener las 2 últimas lecturas de este camión (la actual ya fue insertada)
  const { data: readings } = await supabase
    .from('gps_carrito')
    .select('lat, lng, creado_en')
    .eq('camion_id', camionId)
    .order('creado_en', { ascending: false })
    .limit(2);

  if (!readings || readings.length < 2) return; // No hay lectura previa

  const [current, previous] = readings;
  const dist = distanceMeters(
    previous.lat,
    previous.lng,
    current.lat,
    current.lng
  );

  if (dist >= STATIC_THRESHOLD_METERS) return; // Se está moviendo

  // Calcular tiempo entre las dos lecturas
  const elapsed =
    (new Date(current.creado_en).getTime() -
      new Date(previous.creado_en).getTime()) /
    1000;

  if (elapsed < STATIC_THRESHOLD_SECONDS) return; // Aún no supera umbral

  // Verificar que no exista ya una alerta activa para este camión
  if (await alertaActivaExiste(supabase, camionId, 'gps_estatico')) return;

  // Crear alerta
  await supabase.rpc('crear_alerta_admin', {
    p_tipo: 'gps_estatico',
    p_titulo: 'GPS estático detectado',
    p_mensaje: `El camión lleva más de ${STATIC_THRESHOLD_SECONDS}s en la misma posición (${lat.toFixed(6)}, ${lng.toFixed(6)}).`,
    p_camion_id: camionId,
    p_recorrido_id: null,
    p_chofer_id: null,
    p_dispositivo_id: null,
    p_latitud: lat,
    p_longitud: lng,
    p_datos: { distancia_metros: dist, segundos_estatico: elapsed },
  });

  console.log(`[GPS-ALERT] Alerta gps_estatico creada para camión ${camionId}`);
}

/**
 * Revisa todos los camiones activos y detecta los que llevan > 2 minutos
 * sin enviar datos GPS. Crea alertas gps_desconectado.
 * Diseñado para llamarse desde un endpoint cron.
 */
export async function checkDisconnectedGps(): Promise<{
  checked: number;
  alertsCreated: number;
}> {
  const supabase = createAdminClient();

  // Obtener camiones activos
  const { data: camiones } = await supabase
    .from('camiones')
    .select('id, nombre, clave')
    .eq('estado', 'activo');

  if (!camiones || camiones.length === 0) return { checked: 0, alertsCreated: 0 };

  const threshold = new Date(
    Date.now() - DISCONNECT_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString();

  let alertsCreated = 0;

  for (const camion of camiones) {
    // Última lectura GPS de este camión
    const { data: lastReading } = await supabase
      .from('gps_carrito')
      .select('creado_en, lat, lng')
      .eq('camion_id', camion.id)
      .order('creado_en', { ascending: false })
      .limit(1);

    // Si no tiene lecturas o la última es antigua
    const isDisconnected =
      !lastReading ||
      lastReading.length === 0 ||
      lastReading[0].creado_en < threshold;

    if (!isDisconnected) continue;

    // No duplicar alertas
    if (await alertaActivaExiste(supabase, camion.id, 'gps_desconectado')) continue;

    await supabase.rpc('crear_alerta_admin', {
      p_tipo: 'gps_desconectado',
      p_titulo: 'GPS desconectado',
      p_mensaje: `El camión ${camion.nombre} (${camion.clave}) lleva más de ${DISCONNECT_THRESHOLD_MINUTES} minutos sin enviar señal GPS.`,
      p_camion_id: camion.id,
      p_recorrido_id: null,
      p_chofer_id: null,
      p_dispositivo_id: null,
      p_latitud: lastReading?.[0]?.lat ?? null,
      p_longitud: lastReading?.[0]?.lng ?? null,
      p_datos: {
        ultima_lectura: lastReading?.[0]?.creado_en ?? null,
        umbral_minutos: DISCONNECT_THRESHOLD_MINUTES,
      },
    });

    alertsCreated++;
    console.log(`[GPS-ALERT] Alerta gps_desconectado creada para camión ${camion.clave}`);
  }

  return { checked: camiones.length, alertsCreated };
}
