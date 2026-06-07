// ============================================================
// ENUMS — Mapeados 1:1 desde los tipos de la base de datos
// ============================================================

export type RolUsuario = 'admin' | 'chofer' | 'ciudadano';

export type FuenteUbicacion =
  | 'gps_camion_api'
  | 'gps_camion_propio'
  | 'app_chofer'
  | 'manual';

export type EstadoGps =
  | 'online'
  | 'offline'
  | 'sin_senal'
  | 'estatico'
  | 'bateria_baja'
  | 'desconocido';

export type TipoAlertaAdmin =
  | 'gps_desconectado'
  | 'gps_estatico'
  | 'bateria_baja'
  | 'sos'
  | 'reporte_chofer'
  | 'retraso_ruta'
  | 'fallback_gps'
  | 'otro';

export type EstadoAlertaAdmin =
  | 'nueva'
  | 'vista'
  | 'en_revision'
  | 'resuelta'
  | 'descartada';

export type TipoReporteChofer =
  | 'falla_mecanica'
  | 'accidente'
  | 'trafico'
  | 'bloqueo'
  | 'gps_fallando'
  | 'retraso'
  | 'emergencia'
  | 'otro';

export type TipoEventoNotificacion =
  | 'route_start'
  | 'truck_proximity'
  | 'route_completed'
  | 'gps_disconnected'
  | 'driver_report'
  | 'general_notice';

export type TipoDomicilio = 'casa' | 'trabajo' | 'negocio' | 'otro';

export type TipoEventoAnonimo =
  | 'consulta_colonia'
  | 'consulta_horario'
  | 'consulta_ubicacion_camion'
  | 'consulta_aviso'
  | 'intento_registrar_domicilio'
  | 'intento_activar_notificaciones'
  | 'conversion_a_registrado';

export type TipoSesionAnonima = 'invitado' | 'consulta_publica' | 'temporal';

// ============================================================
// TABLAS — Interfaces principales
// ============================================================

export interface Perfil {
  id: string;
  nombre: string;
  apellidos: string | null;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  acepta_privacidad: boolean;
  fecha_acepta_privacidad: string | null;
  preferencias: Record<string, unknown>;
  creado_en: string;
  actualizado_en: string;
}

export interface Ruta {
  id: string;
  route_id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  color_mapa: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface RutaPosicion {
  id: string;
  ruta_id: string;
  position_id: number;
  latitud: number;
  longitud: number;
  velocidad_referencia_kmh: number | null;
  es_base_salida: boolean;
  es_punto_proximidad: boolean;
  es_retorno_base: boolean;
  descripcion: string | null;
  creado_en: string;
}

export interface ColoniaRuta {
  id: string;
  colonia_id: string;
  ruta_id: string;
  horario_estimado: string | null;
  hora_inicio_estimada: string | null;
  hora_fin_estimada: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Camion {
  id: string;
  clave: string;
  nombre: string;
  truck_id_externo: number | null;
  estado: string;
  consumo_min_litros_dia: number;
  consumo_max_litros_dia: number;
  capacidad_combustible_litros: number | null;
  observaciones_gps: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface DispositivoGps {
  id: string;
  camion_id: string;
  nombre: string;
  fuente: FuenteUbicacion;
  estado: EstadoGps;
  prioridad: number;
  umbral_desconexion_minutos: number;
  umbral_estatico_minutos: number;
  soporta_sos: boolean;
  ultima_conexion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Recorrido {
  id: string;
  camion_id: string;
  chofer_id: string;
  ruta_id: string | null;
  estado: string;
  fuente_gps_activa: FuenteUbicacion | null;
  ultimo_position_id: number | null;
  salida_base_confirmada: boolean;
  retorno_base_confirmado: boolean;
  combustible_estimado_litros: number | null;
  kilometraje_inicio: number | null;
  kilometraje_fin: number | null;
  creado_en: string;
  actualizado_en: string;
}

export interface AlertaAdmin {
  id: string;
  tipo: TipoAlertaAdmin;
  estado: EstadoAlertaAdmin;
  titulo: string;
  mensaje: string;
  camion_id: string | null;
  recorrido_id: string | null;
  chofer_id: string | null;
  dispositivo_id: string | null;
  latitud: number | null;
  longitud: number | null;
  datos: Record<string, unknown>;
  atendido_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ReporteChofer {
  id: string;
  recorrido_id: string | null;
  camion_id: string | null;
  chofer_id: string | null;
  tipo: TipoReporteChofer;
  titulo: string;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: string;
  requiere_notificar_usuarios: boolean;
  notificacion_enviada: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface DomicilioUsuario {
  id: string;
  usuario_id: string;
  alias: string;
  tipo: TipoDomicilio;
  calle: string | null;
  numero_exterior: string | null;
  numero_interior: string | null;
  referencias: string | null;
  colonia_id: string | null;
  ruta_id: string | null;
  latitud: number | null;
  longitud: number | null;
  recibir_notificaciones: boolean;
  notificar_inicio_ruta: boolean;
  notificar_proximidad: boolean;
  notificar_finalizacion: boolean;
  minutos_anticipacion: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface DispositivoUsuario {
  id: string;
  usuario_id: string;
  push_token: string | null;
  plataforma: string | null;
  modelo_dispositivo: string | null;
  app_version: string | null;
  activo: boolean;
  ultimo_uso_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface EventoSos {
  id: string;
  recorrido_id: string | null;
  camion_id: string | null;
  chofer_id: string | null;
  dispositivo_id: string | null;
  origen: string;
  mensaje: string | null;
  latitud: number | null;
  longitud: number | null;
  atendido: boolean;
  creado_en: string;
}

export interface PlantillaNotificacion {
  id: string;
  evento: TipoEventoNotificacion;
  titulo: string;
  cuerpo: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface NotificacionEnviada {
  id: string;
  usuario_id: string | null;
  domicilio_id: string | null;
  dispositivo_usuario_id: string | null;
  aviso_id: string | null;
  reporte_chofer_id: string | null;
  evento: TipoEventoNotificacion | null;
  titulo: string;
  mensaje: string;
  payload: Record<string, unknown>;
  enviado: boolean;
  error: string | null;
  enviado_en: string | null;
  creado_en: string;
}

export interface ConsumoCombustible {
  id: string;
  camion_id: string;
  recorrido_id: string | null;
  fecha: string;
  litros_estimados_min: number;
  litros_estimados_max: number;
  litros_registrados: number | null;
  metodo: string;
  observaciones: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface UbicacionActual {
  id: string;
  camion_id: string;
  recorrido_id: string | null;
  dispositivo_id: string | null;
  fuente: FuenteUbicacion;
  latitud: number;
  longitud: number;
  velocidad_kmh: number | null;
  direccion_grados: number | null;
  position_id: number | null;
  timestamp_origen: string | null;
  actualizado_en: string;
}

export interface GpsIngesta {
  id: string;
  camion_id: string | null;
  recorrido_id: string | null;
  dispositivo_id: string | null;
  fuente: FuenteUbicacion;
  position_id: number | null;
  latitud: number;
  longitud: number;
  velocidad_kmh: number | null;
  direccion_grados: number | null;
  timestamp_origen: string | null;
  payload_raw: Record<string, unknown> | null;
  recibido_en: string;
}

export interface SesionAnonima {
  id: string;
  session_token: string;
  tipo: TipoSesionAnonima;
  colonia_id: string | null;
  ruta_id: string | null;
  plataforma: string | null;
  app_version: string | null;
  modelo_dispositivo: string | null;
  puede_registrar_domicilio: boolean;
  puede_recibir_push_personalizado: boolean;
  puede_guardar_multiples_colonias: boolean;
  puede_reportar_incidencias: boolean;
  solo_ver_camion_en_colonia: boolean;
  activo: boolean;
  ultimo_uso_en: string | null;
  expira_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface EventoAnonimo {
  id: string;
  sesion_anonima_id: string | null;
  tipo: TipoEventoAnonimo;
  colonia_id: string | null;
  ruta_id: string | null;
  datos: Record<string, unknown>;
  creado_en: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  activo: boolean;
  colonia_id: string | null;
  ruta_id: string | null;
  creado_en: string;
}

// ============================================================
// API RESPONSE TYPES — Formato estandarizado
// ============================================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface SuccessResponse {
  ok: true;
  message: string;
}

export interface ErrorResponse {
  ok: false;
  error: string;
  details?: Record<string, unknown> | null;
}

export interface DashboardData {
  camionesActivos: number;
  rutasActivas: number;
  recorridosEnCurso: number;
  alertasPendientes: number;
  reportesChoferPendientes: number;
  gpsDesconectados: number;
  ciudadanosRegistrados: number;
  choferesActivos: number;
  sesionesAnonimasActivas: number;
  consumoEstimadoDiaLitros: {
    minimo: number;
    maximo: number;
  };
}

export interface NotificacionMasivaResponse {
  ok: true;
  usuariosObjetivo: number;
  enviadas: number;
  fallidas: number;
  message: string;
}

export interface EstimacionCombustible {
  recorridoId: string;
  camionId: string;
  litrosEstimadosMin: number;
  litrosEstimadosMax: number;
  observacion: string;
}
