-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alertas_admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo USER-DEFINED NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'nueva'::estado_alerta_admin,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  camion_id uuid,
  recorrido_id uuid,
  chofer_id uuid,
  dispositivo_id uuid,
  latitud double precision,
  longitud double precision,
  ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography
    ELSE NULL::geography
END,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  atendido_por uuid,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alertas_admin_pkey PRIMARY KEY (id),
  CONSTRAINT alertas_admin_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT alertas_admin_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT alertas_admin_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.perfiles(id),
  CONSTRAINT alertas_admin_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos_gps(id),
  CONSTRAINT alertas_admin_atendido_por_fkey FOREIGN KEY (atendido_por) REFERENCES public.perfiles(id)
);
CREATE TABLE public.avisos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  tipo USER-DEFINED NOT NULL DEFAULT 'general'::tipo_aviso,
  colonia_id uuid,
  dia USER-DEFINED,
  creado_por uuid,
  activo boolean NOT NULL DEFAULT true,
  programado_para timestamp with time zone,
  enviado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT avisos_pkey PRIMARY KEY (id),
  CONSTRAINT avisos_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id),
  CONSTRAINT avisos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.perfiles(id)
);
CREATE TABLE public.calendario_recoleccion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  colonia_id uuid NOT NULL,
  dia USER-DEFINED NOT NULL,
  hora_inicio time without time zone,
  hora_fin time without time zone,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT calendario_recoleccion_pkey PRIMARY KEY (id),
  CONSTRAINT calendario_recoleccion_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id)
);
CREATE TABLE public.camiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clave text NOT NULL UNIQUE,
  nombre text,
  placas text,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::estado_camion,
  es_prototipo boolean NOT NULL DEFAULT false,
  descripcion text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  truck_id_externo integer,
  consumo_min_litros_dia numeric DEFAULT 60.00,
  consumo_max_litros_dia numeric DEFAULT 90.00,
  capacidad_combustible_litros numeric,
  observaciones_gps text,
  CONSTRAINT camiones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categorias_residuos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  icono text,
  color text,
  activa boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categorias_residuos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.choferes_camiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chofer_id uuid NOT NULL,
  camion_id uuid NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  asignado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT choferes_camiones_pkey PRIMARY KEY (id),
  CONSTRAINT choferes_camiones_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.perfiles(id),
  CONSTRAINT choferes_camiones_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id)
);
CREATE TABLE public.colonia_rutas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  colonia_id uuid NOT NULL,
  ruta_id uuid NOT NULL,
  horario_estimado text,
  hora_inicio_estimada time without time zone,
  hora_fin_estimada time without time zone,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT colonia_rutas_pkey PRIMARY KEY (id),
  CONSTRAINT colonia_rutas_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id),
  CONSTRAINT colonia_rutas_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id)
);
CREATE TABLE public.colonias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  latitud double precision,
  longitud double precision,
  ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography
    ELSE NULL::geography
END,
  activa boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT colonias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.consumo_combustible (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  camion_id uuid NOT NULL,
  recorrido_id uuid,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  litros_estimados_min numeric DEFAULT 60.00,
  litros_estimados_max numeric DEFAULT 90.00,
  litros_registrados numeric,
  metodo text NOT NULL DEFAULT 'estimado'::text,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consumo_combustible_pkey PRIMARY KEY (id),
  CONSTRAINT consumo_combustible_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT consumo_combustible_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id)
);
CREATE TABLE public.dispositivo_colonia_suscripciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispositivo_app_id uuid NOT NULL,
  colonia_id uuid NOT NULL,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispositivo_colonia_suscripciones_pkey PRIMARY KEY (id),
  CONSTRAINT dispositivo_colonia_suscripciones_dispositivo_app_id_fkey FOREIGN KEY (dispositivo_app_id) REFERENCES public.dispositivos_app(id),
  CONSTRAINT dispositivo_colonia_suscripciones_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id)
);
CREATE TABLE public.dispositivos_app (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anonimo_id text NOT NULL UNIQUE,
  expo_push_token text,
  plataforma text,
  colonia_id uuid,
  modo_accesible boolean NOT NULL DEFAULT false,
  ultima_latitud double precision,
  ultima_longitud double precision,
  ultima_ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((ultima_latitud IS NOT NULL) AND (ultima_longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(ultima_longitud, ultima_latitud), 4326))::geography
    ELSE NULL::geography
END,
  ultimo_uso_en timestamp with time zone NOT NULL DEFAULT now(),
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispositivos_app_pkey PRIMARY KEY (id),
  CONSTRAINT dispositivos_app_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id)
);
CREATE TABLE public.dispositivos_gps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  camion_id uuid NOT NULL,
  nombre text NOT NULL,
  fuente USER-DEFINED NOT NULL,
  token_dispositivo text UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  ultima_conexion timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  estado USER-DEFINED NOT NULL DEFAULT 'desconocido'::estado_gps,
  prioridad integer NOT NULL DEFAULT 1,
  umbral_desconexion_minutos integer NOT NULL DEFAULT 10,
  umbral_estatico_minutos integer NOT NULL DEFAULT 15,
  soporta_sos boolean NOT NULL DEFAULT false,
  tiene_bateria boolean NOT NULL DEFAULT false,
  tiene_memoria_interna boolean NOT NULL DEFAULT false,
  tiene_sim boolean NOT NULL DEFAULT false,
  descripcion_hardware text,
  CONSTRAINT dispositivos_gps_pkey PRIMARY KEY (id),
  CONSTRAINT dispositivos_gps_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id)
);
CREATE TABLE public.dispositivos_usuario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  push_token text,
  plataforma text,
  modelo_dispositivo text,
  app_version text,
  activo boolean NOT NULL DEFAULT true,
  ultimo_uso_en timestamp with time zone DEFAULT now(),
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispositivos_usuario_pkey PRIMARY KEY (id),
  CONSTRAINT dispositivos_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id)
);
CREATE TABLE public.domicilios_usuario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  alias text NOT NULL,
  tipo USER-DEFINED NOT NULL DEFAULT 'casa'::tipo_domicilio,
  calle text,
  numero_exterior text,
  numero_interior text,
  referencias text,
  colonia_id uuid,
  ruta_id uuid,
  latitud double precision,
  longitud double precision,
  ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography
    ELSE NULL::geography
END,
  recibir_notificaciones boolean NOT NULL DEFAULT true,
  notificar_inicio_ruta boolean NOT NULL DEFAULT true,
  notificar_proximidad boolean NOT NULL DEFAULT true,
  notificar_finalizacion boolean NOT NULL DEFAULT false,
  minutos_anticipacion integer NOT NULL DEFAULT 15,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT domicilios_usuario_pkey PRIMARY KEY (id),
  CONSTRAINT domicilios_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id),
  CONSTRAINT domicilios_usuario_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id),
  CONSTRAINT domicilios_usuario_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id)
);
CREATE TABLE public.eventos_anonimos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sesion_anonima_id uuid,
  tipo USER-DEFINED NOT NULL,
  colonia_id uuid,
  ruta_id uuid,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT eventos_anonimos_pkey PRIMARY KEY (id),
  CONSTRAINT eventos_anonimos_sesion_anonima_id_fkey FOREIGN KEY (sesion_anonima_id) REFERENCES public.sesiones_anonimas(id),
  CONSTRAINT eventos_anonimos_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id),
  CONSTRAINT eventos_anonimos_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id)
);
CREATE TABLE public.eventos_sos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recorrido_id uuid,
  camion_id uuid,
  chofer_id uuid,
  dispositivo_id uuid,
  origen text NOT NULL DEFAULT 'desconocido'::text,
  mensaje text,
  latitud double precision,
  longitud double precision,
  ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography
    ELSE NULL::geography
END,
  atendido boolean NOT NULL DEFAULT false,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT eventos_sos_pkey PRIMARY KEY (id),
  CONSTRAINT eventos_sos_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT eventos_sos_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT eventos_sos_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.perfiles(id),
  CONSTRAINT eventos_sos_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos_gps(id)
);
CREATE TABLE public.gps_ingestas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  camion_id uuid,
  recorrido_id uuid,
  dispositivo_id uuid,
  fuente USER-DEFINED NOT NULL,
  position_id integer,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  velocidad_kmh numeric,
  direccion_grados numeric,
  timestamp_origen timestamp with time zone,
  payload_raw jsonb,
  recibido_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gps_ingestas_pkey PRIMARY KEY (id),
  CONSTRAINT gps_ingestas_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT gps_ingestas_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT gps_ingestas_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos_gps(id)
);
CREATE TABLE public.historial_ubicaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recorrido_id uuid NOT NULL,
  camion_id uuid NOT NULL,
  dispositivo_id uuid,
  fuente USER-DEFINED NOT NULL,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  ubicacion USER-DEFINED DEFAULT (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography,
  velocidad_kmh numeric,
  direccion_grados numeric,
  precision_metros numeric,
  bateria_porcentaje integer,
  registrado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT historial_ubicaciones_pkey PRIMARY KEY (id),
  CONSTRAINT historial_ubicaciones_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT historial_ubicaciones_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT historial_ubicaciones_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos_gps(id)
);
CREATE TABLE public.notificaciones_enviadas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  domicilio_id uuid,
  dispositivo_usuario_id uuid,
  aviso_id uuid,
  reporte_chofer_id uuid,
  evento USER-DEFINED,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  enviado boolean NOT NULL DEFAULT false,
  error text,
  enviado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notificaciones_enviadas_pkey PRIMARY KEY (id),
  CONSTRAINT notificaciones_enviadas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id),
  CONSTRAINT notificaciones_enviadas_domicilio_id_fkey FOREIGN KEY (domicilio_id) REFERENCES public.domicilios_usuario(id),
  CONSTRAINT notificaciones_enviadas_dispositivo_usuario_id_fkey FOREIGN KEY (dispositivo_usuario_id) REFERENCES public.dispositivos_usuario(id),
  CONSTRAINT notificaciones_enviadas_aviso_id_fkey FOREIGN KEY (aviso_id) REFERENCES public.avisos(id),
  CONSTRAINT notificaciones_enviadas_reporte_chofer_id_fkey FOREIGN KEY (reporte_chofer_id) REFERENCES public.reportes_chofer(id)
);


CREATE TABLE public.perfiles (
  id uuid NOT NULL,
  nombre text NOT NULL,
  correo text UNIQUE,
  telefono text,
  rol USER-DEFINED NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  apellidos text,
  acepta_privacidad boolean NOT NULL DEFAULT false,
  fecha_acepta_privacidad timestamp with time zone,
  preferencias jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT perfiles_pkey PRIMARY KEY (id),
  CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);


CREATE TABLE public.plantillas_notificacion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evento USER-DEFINED NOT NULL UNIQUE,
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plantillas_notificacion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.recorrido_colonias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recorrido_id uuid NOT NULL,
  colonia_id uuid NOT NULL,
  orden integer,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recorrido_colonias_pkey PRIMARY KEY (id),
  CONSTRAINT recorrido_colonias_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT recorrido_colonias_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id)
);
CREATE TABLE public.recorridos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  camion_id uuid NOT NULL,
  chofer_id uuid,
  dispositivo_id uuid,
  dia USER-DEFINED NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'programado'::estado_recorrido,
  inicio_programado timestamp with time zone,
  fin_programado timestamp with time zone,
  inicio_real timestamp with time zone,
  fin_real timestamp with time zone,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  ruta_id uuid,
  kilometraje_inicio numeric,
  kilometraje_fin numeric,
  combustible_estimado_litros numeric,
  fuente_gps_activa USER-DEFINED,
  ultimo_position_id integer,
  salida_base_confirmada boolean NOT NULL DEFAULT false,
  retorno_base_confirmado boolean NOT NULL DEFAULT false,
  CONSTRAINT recorridos_pkey PRIMARY KEY (id),
  CONSTRAINT recorridos_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id),
  CONSTRAINT recorridos_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT recorridos_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.perfiles(id),
  CONSTRAINT recorridos_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos_gps(id)
);
CREATE TABLE public.reportes_chofer (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recorrido_id uuid,
  camion_id uuid,
  chofer_id uuid,
  tipo USER-DEFINED NOT NULL,
  titulo text NOT NULL,
  descripcion text,
  latitud double precision,
  longitud double precision,
  ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography
    ELSE NULL::geography
END,
  estado USER-DEFINED NOT NULL DEFAULT 'nuevo'::estado_reporte,
  requiere_notificar_usuarios boolean NOT NULL DEFAULT false,
  notificacion_enviada boolean NOT NULL DEFAULT false,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reportes_chofer_pkey PRIMARY KEY (id),
  CONSTRAINT reportes_chofer_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT reportes_chofer_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT reportes_chofer_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.perfiles(id)
);
CREATE TABLE public.reportes_ciudadanos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anonimo_id text,
  colonia_id uuid,
  tipo text NOT NULL,
  descripcion text,
  latitud double precision,
  longitud double precision,
  ubicacion USER-DEFINED DEFAULT 
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography
    ELSE NULL::geography
END,
  estado USER-DEFINED NOT NULL DEFAULT 'nuevo'::estado_reporte,
  atendido_por uuid,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reportes_ciudadanos_pkey PRIMARY KEY (id),
  CONSTRAINT reportes_ciudadanos_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id),
  CONSTRAINT reportes_ciudadanos_atendido_por_fkey FOREIGN KEY (atendido_por) REFERENCES public.perfiles(id)
);
CREATE TABLE public.residuos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  instrucciones text,
  permitido boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT residuos_pkey PRIMARY KEY (id),
  CONSTRAINT residuos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_residuos(id)
);
CREATE TABLE public.ruta_posiciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ruta_id uuid NOT NULL,
  position_id integer NOT NULL,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  ubicacion USER-DEFINED DEFAULT (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography,
  velocidad_referencia_kmh numeric,
  timestamp_referencia timestamp with time zone,
  es_base_salida boolean NOT NULL DEFAULT false,
  es_punto_proximidad boolean NOT NULL DEFAULT false,
  es_retorno_base boolean NOT NULL DEFAULT false,
  descripcion text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ruta_posiciones_pkey PRIMARY KEY (id),
  CONSTRAINT ruta_posiciones_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id)
);
CREATE TABLE public.rutas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  route_id text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  estado text NOT NULL DEFAULT 'activa'::text,
  color_mapa text DEFAULT '#00897B'::text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rutas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sesiones_anonimas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE,
  tipo USER-DEFINED NOT NULL DEFAULT 'invitado'::tipo_sesion_anonima,
  colonia_id uuid,
  ruta_id uuid,
  plataforma text,
  app_version text,
  modelo_dispositivo text,
  puede_registrar_domicilio boolean NOT NULL DEFAULT false,
  puede_recibir_push_personalizado boolean NOT NULL DEFAULT false,
  puede_guardar_multiples_colonias boolean NOT NULL DEFAULT false,
  puede_reportar_incidencias boolean NOT NULL DEFAULT false,
  solo_ver_camion_en_colonia boolean NOT NULL DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  ultimo_uso_en timestamp with time zone DEFAULT now(),
  expira_en timestamp with time zone DEFAULT (now() + '30 days'::interval),
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sesiones_anonimas_pkey PRIMARY KEY (id),
  CONSTRAINT sesiones_anonimas_colonia_id_fkey FOREIGN KEY (colonia_id) REFERENCES public.colonias(id),
  CONSTRAINT sesiones_anonimas_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.ubicaciones_actuales (
  recorrido_id uuid NOT NULL,
  camion_id uuid NOT NULL,
  dispositivo_id uuid,
  fuente USER-DEFINED NOT NULL,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  ubicacion USER-DEFINED DEFAULT (st_setsrid(st_makepoint(longitud, latitud), 4326))::geography,
  velocidad_kmh numeric,
  direccion_grados numeric,
  precision_metros numeric,
  bateria_porcentaje integer,
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ubicaciones_actuales_pkey PRIMARY KEY (recorrido_id),
  CONSTRAINT ubicaciones_actuales_recorrido_id_fkey FOREIGN KEY (recorrido_id) REFERENCES public.recorridos(id),
  CONSTRAINT ubicaciones_actuales_camion_id_fkey FOREIGN KEY (camion_id) REFERENCES public.camiones(id),
  CONSTRAINT ubicaciones_actuales_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos_gps(id)
);