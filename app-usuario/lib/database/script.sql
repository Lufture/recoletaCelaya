-- ============================================================
-- RECOLECTA CELAYA - MIGRACIÓN V2
-- Cambios:
-- - Ciudadanos registrados
-- - Múltiples domicilios/puntos de recolección
-- - Rutas con checkpoints del dataset
-- - GPS redundante: API camión, app chofer, ESP32
-- - Alertas por GPS desconectado/estático/SOS
-- - Reportes de chofer
-- - Notificaciones por eventos
-- - Estimación de combustible
-- ============================================================


-- ============================================================
-- 1. ACTUALIZAR ENUMS EXISTENTES
-- ============================================================

alter type public.rol_usuario add value if not exists 'ciudadano';

alter type public.fuente_ubicacion add value if not exists 'gps_camion_api';
alter type public.fuente_ubicacion add value if not exists 'gps_camion_propio';

do $$ begin
  create type public.tipo_domicilio as enum (
    'casa',
    'trabajo',
    'negocio',
    'otro'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.estado_gps as enum (
    'online',
    'offline',
    'sin_senal',
    'estatico',
    'bateria_baja',
    'desconocido'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tipo_alerta_admin as enum (
    'gps_desconectado',
    'gps_estatico',
    'bateria_baja',
    'sos',
    'reporte_chofer',
    'retraso_ruta',
    'fallback_gps',
    'otro'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.estado_alerta_admin as enum (
    'nueva',
    'vista',
    'en_revision',
    'resuelta',
    'descartada'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tipo_reporte_chofer as enum (
    'falla_mecanica',
    'accidente',
    'trafico',
    'bloqueo',
    'gps_fallando',
    'retraso',
    'emergencia',
    'otro'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tipo_evento_notificacion as enum (
    'route_start',
    'truck_proximity',
    'route_completed',
    'gps_disconnected',
    'driver_report',
    'general_notice'
  );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- 2. AMPLIAR PERFILES
-- Ahora perfiles también puede incluir ciudadanos registrados.
-- ============================================================

alter table public.perfiles
add column if not exists apellidos text;

alter table public.perfiles
add column if not exists acepta_privacidad boolean not null default false;

alter table public.perfiles
add column if not exists fecha_acepta_privacidad timestamptz;

alter table public.perfiles
add column if not exists preferencias jsonb not null default '{}'::jsonb;


-- ============================================================
-- 3. RUTAS DEL DATASET
-- No son rutas completas de calle; son rutas operativas/checkpoints.
-- ============================================================

create table if not exists public.rutas (
  id uuid primary key default gen_random_uuid(),
  route_id text not null unique, -- Ejemplo: RUTA-01
  nombre text not null,
  descripcion text,
  estado text not null default 'activa',
  color_mapa text default '#00897B',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_rutas_route_id
on public.rutas(route_id);

drop trigger if exists trg_rutas_updated_at on public.rutas;
create trigger trg_rutas_updated_at
before update on public.rutas
for each row execute function public.set_updated_at();


-- ============================================================
-- 4. POSICIONES / CHECKPOINTS DE RUTA
-- Sirve para el dataset: positionId 1,2,3...8.
-- El primer punto puede ser la base/salida.
-- No representa necesariamente toda la ruta calle por calle.
-- ============================================================

create table if not exists public.ruta_posiciones (
  id uuid primary key default gen_random_uuid(),
  ruta_id uuid not null references public.rutas(id) on delete cascade,
  position_id int not null,
  latitud double precision not null,
  longitud double precision not null,
  ubicacion geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(longitud, latitud), 4326)::geography
  ) stored,
  velocidad_referencia_kmh numeric(6,2),
  timestamp_referencia timestamptz,
  es_base_salida boolean not null default false,
  es_punto_proximidad boolean not null default false,
  es_retorno_base boolean not null default false,
  descripcion text,
  creado_en timestamptz not null default now(),
  unique (ruta_id, position_id)
);

create index if not exists idx_ruta_posiciones_ruta
on public.ruta_posiciones(ruta_id);

create index if not exists idx_ruta_posiciones_ubicacion
on public.ruta_posiciones
using gist (ubicacion);


-- ============================================================
-- 5. RELACIÓN COLONIA - RUTA - HORARIO ESTIMADO
-- Se agrega a lo que ya existía de calendario por día.
-- ============================================================

create table if not exists public.colonia_rutas (
  id uuid primary key default gen_random_uuid(),
  colonia_id uuid not null references public.colonias(id) on delete cascade,
  ruta_id uuid not null references public.rutas(id) on delete cascade,
  horario_estimado text,
  hora_inicio_estimada time,
  hora_fin_estimada time,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (colonia_id, ruta_id)
);

create index if not exists idx_colonia_rutas_colonia
on public.colonia_rutas(colonia_id);

create index if not exists idx_colonia_rutas_ruta
on public.colonia_rutas(ruta_id);

drop trigger if exists trg_colonia_rutas_updated_at on public.colonia_rutas;
create trigger trg_colonia_rutas_updated_at
before update on public.colonia_rutas
for each row execute function public.set_updated_at();


-- ============================================================
-- 6. DOMICILIOS / PUNTOS DE RECOLECCIÓN DEL USUARIO
-- Cada ciudadano puede registrar varios domicilios.
-- Aquí se define dónde quiere recibir notificaciones.
-- ============================================================

create table if not exists public.domicilios_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  alias text not null, -- Casa, Trabajo, Negocio, etc.
  tipo public.tipo_domicilio not null default 'casa',
  calle text,
  numero_exterior text,
  numero_interior text,
  referencias text,
  colonia_id uuid references public.colonias(id) on delete set null,
  ruta_id uuid references public.rutas(id) on delete set null,
  latitud double precision,
  longitud double precision,
  ubicacion geography(Point, 4326) generated always as (
    case
      when latitud is not null and longitud is not null
      then st_setsrid(st_makepoint(longitud, latitud), 4326)::geography
      else null
    end
  ) stored,
  recibir_notificaciones boolean not null default true,
  notificar_inicio_ruta boolean not null default true,
  notificar_proximidad boolean not null default true,
  notificar_finalizacion boolean not null default false,
  minutos_anticipacion int not null default 15,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_domicilios_usuario_usuario
on public.domicilios_usuario(usuario_id);

create index if not exists idx_domicilios_usuario_colonia
on public.domicilios_usuario(colonia_id);

create index if not exists idx_domicilios_usuario_ruta
on public.domicilios_usuario(ruta_id);

create index if not exists idx_domicilios_usuario_ubicacion
on public.domicilios_usuario
using gist (ubicacion);

drop trigger if exists trg_domicilios_usuario_updated_at on public.domicilios_usuario;
create trigger trg_domicilios_usuario_updated_at
before update on public.domicilios_usuario
for each row execute function public.set_updated_at();


-- ============================================================
-- 7. DISPOSITIVOS DEL USUARIO REGISTRADO
-- Sustituye el uso principal de ciudadanos anónimos.
-- Puede conservarse dispositivos_app para pruebas o modo invitado.
-- ============================================================

create table if not exists public.dispositivos_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  push_token text,
  plataforma text, -- ios, android, web
  modelo_dispositivo text,
  app_version text,
  activo boolean not null default true,
  ultimo_uso_en timestamptz default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (usuario_id, push_token)
);

create index if not exists idx_dispositivos_usuario_usuario
on public.dispositivos_usuario(usuario_id);

drop trigger if exists trg_dispositivos_usuario_updated_at on public.dispositivos_usuario;
create trigger trg_dispositivos_usuario_updated_at
before update on public.dispositivos_usuario
for each row execute function public.set_updated_at();


-- ============================================================
-- 8. AMPLIAR CAMIONES PARA GPS Y COMBUSTIBLE
-- ============================================================

alter table public.camiones
add column if not exists truck_id_externo int;

alter table public.camiones
add column if not exists consumo_min_litros_dia numeric(6,2) default 60.00;

alter table public.camiones
add column if not exists consumo_max_litros_dia numeric(6,2) default 90.00;

alter table public.camiones
add column if not exists capacidad_combustible_litros numeric(6,2);

alter table public.camiones
add column if not exists observaciones_gps text;

create unique index if not exists idx_camiones_truck_id_externo
on public.camiones(truck_id_externo)
where truck_id_externo is not null;


-- ============================================================
-- 9. AMPLIAR DISPOSITIVOS GPS
-- Maneja GPS oficial/API, app chofer y prototipo propio.
-- ============================================================

alter table public.dispositivos_gps
add column if not exists estado public.estado_gps not null default 'desconocido';

alter table public.dispositivos_gps
add column if not exists prioridad int not null default 1;
-- prioridad menor = fuente preferida

alter table public.dispositivos_gps
add column if not exists umbral_desconexion_minutos int not null default 10;

alter table public.dispositivos_gps
add column if not exists umbral_estatico_minutos int not null default 15;

alter table public.dispositivos_gps
add column if not exists soporta_sos boolean not null default false;

alter table public.dispositivos_gps
add column if not exists tiene_bateria boolean not null default false;

alter table public.dispositivos_gps
add column if not exists tiene_memoria_interna boolean not null default false;

alter table public.dispositivos_gps
add column if not exists tiene_sim boolean not null default false;

alter table public.dispositivos_gps
add column if not exists descripcion_hardware text;


-- ============================================================
-- 10. AMPLIAR RECORRIDOS
-- Ahora puede relacionarse con ruta y controlar jornada.
-- ============================================================

alter table public.recorridos
add column if not exists ruta_id uuid references public.rutas(id) on delete set null;

alter table public.recorridos
add column if not exists kilometraje_inicio numeric(10,2);

alter table public.recorridos
add column if not exists kilometraje_fin numeric(10,2);

alter table public.recorridos
add column if not exists combustible_estimado_litros numeric(8,2);

alter table public.recorridos
add column if not exists fuente_gps_activa public.fuente_ubicacion;

alter table public.recorridos
add column if not exists ultimo_position_id int;

alter table public.recorridos
add column if not exists salida_base_confirmada boolean not null default false;

alter table public.recorridos
add column if not exists retorno_base_confirmado boolean not null default false;

create index if not exists idx_recorridos_ruta
on public.recorridos(ruta_id);


-- ============================================================
-- 11. INGESTA CRUDA DE GPS
-- Guarda datos originales de API, app chofer o ESP32.
-- Útil para auditoría y depuración.
-- ============================================================

create table if not exists public.gps_ingestas (
  id uuid primary key default gen_random_uuid(),
  camion_id uuid references public.camiones(id) on delete set null,
  recorrido_id uuid references public.recorridos(id) on delete set null,
  dispositivo_id uuid references public.dispositivos_gps(id) on delete set null,
  fuente public.fuente_ubicacion not null,
  position_id int,
  latitud double precision not null,
  longitud double precision not null,
  velocidad_kmh numeric(6,2),
  direccion_grados numeric(6,2),
  timestamp_origen timestamptz,
  payload_raw jsonb,
  recibido_en timestamptz not null default now()
);

create index if not exists idx_gps_ingestas_recorrido
on public.gps_ingestas(recorrido_id, recibido_en desc);

create index if not exists idx_gps_ingestas_camion
on public.gps_ingestas(camion_id, recibido_en desc);


-- ============================================================
-- 12. ALERTAS AL ADMIN
-- GPS desconectado, GPS estático, SOS, reportes, etc.
-- ============================================================

create table if not exists public.alertas_admin (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_alerta_admin not null,
  estado public.estado_alerta_admin not null default 'nueva',
  titulo text not null,
  mensaje text not null,
  camion_id uuid references public.camiones(id) on delete set null,
  recorrido_id uuid references public.recorridos(id) on delete set null,
  chofer_id uuid references public.perfiles(id) on delete set null,
  dispositivo_id uuid references public.dispositivos_gps(id) on delete set null,
  latitud double precision,
  longitud double precision,
  ubicacion geography(Point, 4326) generated always as (
    case
      when latitud is not null and longitud is not null
      then st_setsrid(st_makepoint(longitud, latitud), 4326)::geography
      else null
    end
  ) stored,
  datos jsonb not null default '{}'::jsonb,
  atendido_por uuid references public.perfiles(id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_alertas_admin_estado
on public.alertas_admin(estado);

create index if not exists idx_alertas_admin_tipo
on public.alertas_admin(tipo);

create index if not exists idx_alertas_admin_recorrido
on public.alertas_admin(recorrido_id);

drop trigger if exists trg_alertas_admin_updated_at on public.alertas_admin;
create trigger trg_alertas_admin_updated_at
before update on public.alertas_admin
for each row execute function public.set_updated_at();


-- ============================================================
-- 13. REPORTES DEL CHOFER
-- El chofer reporta fallas, tráfico, emergencia o GPS.
-- Admin puede notificar a usuarios afectados.
-- ============================================================

create table if not exists public.reportes_chofer (
  id uuid primary key default gen_random_uuid(),
  recorrido_id uuid references public.recorridos(id) on delete set null,
  camion_id uuid references public.camiones(id) on delete set null,
  chofer_id uuid references public.perfiles(id) on delete set null,
  tipo public.tipo_reporte_chofer not null,
  titulo text not null,
  descripcion text,
  latitud double precision,
  longitud double precision,
  ubicacion geography(Point, 4326) generated always as (
    case
      when latitud is not null and longitud is not null
      then st_setsrid(st_makepoint(longitud, latitud), 4326)::geography
      else null
    end
  ) stored,
  estado public.estado_reporte not null default 'nuevo',
  requiere_notificar_usuarios boolean not null default false,
  notificacion_enviada boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_reportes_chofer_recorrido
on public.reportes_chofer(recorrido_id);

create index if not exists idx_reportes_chofer_estado
on public.reportes_chofer(estado);

drop trigger if exists trg_reportes_chofer_updated_at on public.reportes_chofer;
create trigger trg_reportes_chofer_updated_at
before update on public.reportes_chofer
for each row execute function public.set_updated_at();


-- ============================================================
-- 14. BOTÓN SOS
-- Puede venir de app del chofer o del módulo GPS.
-- ============================================================

create table if not exists public.eventos_sos (
  id uuid primary key default gen_random_uuid(),
  recorrido_id uuid references public.recorridos(id) on delete set null,
  camion_id uuid references public.camiones(id) on delete set null,
  chofer_id uuid references public.perfiles(id) on delete set null,
  dispositivo_id uuid references public.dispositivos_gps(id) on delete set null,
  origen text not null default 'desconocido', -- app_chofer, modulo_gps
  mensaje text,
  latitud double precision,
  longitud double precision,
  ubicacion geography(Point, 4326) generated always as (
    case
      when latitud is not null and longitud is not null
      then st_setsrid(st_makepoint(longitud, latitud), 4326)::geography
      else null
    end
  ) stored,
  atendido boolean not null default false,
  creado_en timestamptz not null default now()
);

create index if not exists idx_eventos_sos_recorrido
on public.eventos_sos(recorrido_id);

create index if not exists idx_eventos_sos_atendido
on public.eventos_sos(atendido);


-- ============================================================
-- 15. PLANTILLAS DE NOTIFICACIÓN POR EVENTO
-- Basado en dataset: ROUTE_START, TRUCK_PROXIMITY, ROUTE_COMPLETED.
-- ============================================================

create table if not exists public.plantillas_notificacion (
  id uuid primary key default gen_random_uuid(),
  evento public.tipo_evento_notificacion not null unique,
  titulo text not null,
  cuerpo text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

drop trigger if exists trg_plantillas_notificacion_updated_at on public.plantillas_notificacion;
create trigger trg_plantillas_notificacion_updated_at
before update on public.plantillas_notificacion
for each row execute function public.set_updated_at();

insert into public.plantillas_notificacion (evento, titulo, cuerpo)
values
  (
    'route_start',
    '¡Ruta iniciada!',
    'El camión recolector ha salido rumbo a tu sector. Asegúrate de tener listos tus residuos.'
  ),
  (
    'truck_proximity',
    'Camión cercano',
    'El camión está a menos de 15 minutos de tu domicilio. Es momento de sacar tus bolsas a la acera.'
  ),
  (
    'route_completed',
    'Servicio finalizado',
    'El camión de tu sector ha concluido su jornada de recolección diaria.'
  )
on conflict (evento) do nothing;


-- ============================================================
-- 16. HISTORIAL DE NOTIFICACIONES ENVIADAS
-- ============================================================

create table if not exists public.notificaciones_enviadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.perfiles(id) on delete set null,
  domicilio_id uuid references public.domicilios_usuario(id) on delete set null,
  dispositivo_usuario_id uuid references public.dispositivos_usuario(id) on delete set null,
  aviso_id uuid references public.avisos(id) on delete set null,
  reporte_chofer_id uuid references public.reportes_chofer(id) on delete set null,
  evento public.tipo_evento_notificacion,
  titulo text not null,
  mensaje text not null,
  payload jsonb not null default '{}'::jsonb,
  enviado boolean not null default false,
  error text,
  enviado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists idx_notificaciones_enviadas_usuario
on public.notificaciones_enviadas(usuario_id, creado_en desc);

create index if not exists idx_notificaciones_enviadas_domicilio
on public.notificaciones_enviadas(domicilio_id, creado_en desc);


-- ============================================================
-- 17. CONSUMO DE COMBUSTIBLE
-- Estimación diaria de 60 a 90 litros si no hay medición real.
-- ============================================================

create table if not exists public.consumo_combustible (
  id uuid primary key default gen_random_uuid(),
  camion_id uuid not null references public.camiones(id) on delete cascade,
  recorrido_id uuid references public.recorridos(id) on delete set null,
  fecha date not null default current_date,
  litros_estimados_min numeric(8,2) default 60.00,
  litros_estimados_max numeric(8,2) default 90.00,
  litros_registrados numeric(8,2),
  metodo text not null default 'estimado',
  observaciones text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (camion_id, fecha, recorrido_id)
);

create index if not exists idx_consumo_combustible_fecha
on public.consumo_combustible(fecha);

drop trigger if exists trg_consumo_combustible_updated_at on public.consumo_combustible;
create trigger trg_consumo_combustible_updated_at
before update on public.consumo_combustible
for each row execute function public.set_updated_at();


-- ============================================================
-- 18. FUNCIÓN: REGISTRAR INGESTA GPS
-- Guarda dato crudo y actualiza ubicación actual/historial.
-- Puede usarse desde Edge Function para API, app chofer o ESP32.
-- ============================================================

create or replace function public.registrar_ingesta_gps(
  p_camion_id uuid,
  p_recorrido_id uuid,
  p_dispositivo_id uuid,
  p_fuente public.fuente_ubicacion,
  p_latitud double precision,
  p_longitud double precision,
  p_velocidad_kmh numeric default null,
  p_direccion_grados numeric default null,
  p_position_id int default null,
  p_timestamp_origen timestamptz default null,
  p_payload_raw jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gps_ingestas (
    camion_id,
    recorrido_id,
    dispositivo_id,
    fuente,
    position_id,
    latitud,
    longitud,
    velocidad_kmh,
    direccion_grados,
    timestamp_origen,
    payload_raw
  )
  values (
    p_camion_id,
    p_recorrido_id,
    p_dispositivo_id,
    p_fuente,
    p_position_id,
    p_latitud,
    p_longitud,
    p_velocidad_kmh,
    p_direccion_grados,
    p_timestamp_origen,
    p_payload_raw
  );

  perform public.actualizar_ubicacion_camion(
    p_recorrido_id,
    p_camion_id,
    p_dispositivo_id,
    p_fuente,
    p_latitud,
    p_longitud,
    p_velocidad_kmh,
    p_direccion_grados,
    null,
    null
  );

  update public.recorridos
  set ultimo_position_id = coalesce(p_position_id, ultimo_position_id),
      fuente_gps_activa = p_fuente,
      actualizado_en = now()
  where id = p_recorrido_id;

  update public.dispositivos_gps
  set estado = 'online',
      ultima_conexion = now(),
      actualizado_en = now()
  where id = p_dispositivo_id;
end;
$$;


-- ============================================================
-- 19. FUNCIÓN: CREAR ALERTA ADMIN
-- ============================================================

create or replace function public.crear_alerta_admin(
  p_tipo public.tipo_alerta_admin,
  p_titulo text,
  p_mensaje text,
  p_camion_id uuid default null,
  p_recorrido_id uuid default null,
  p_chofer_id uuid default null,
  p_dispositivo_id uuid default null,
  p_latitud double precision default null,
  p_longitud double precision default null,
  p_datos jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alerta_id uuid;
begin
  insert into public.alertas_admin (
    tipo,
    titulo,
    mensaje,
    camion_id,
    recorrido_id,
    chofer_id,
    dispositivo_id,
    latitud,
    longitud,
    datos
  )
  values (
    p_tipo,
    p_titulo,
    p_mensaje,
    p_camion_id,
    p_recorrido_id,
    p_chofer_id,
    p_dispositivo_id,
    p_latitud,
    p_longitud,
    coalesce(p_datos, '{}'::jsonb)
  )
  returning id into v_alerta_id;

  return v_alerta_id;
end;
$$;


-- ============================================================
-- 20. FUNCIÓN: REGISTRAR SOS
-- Crea evento SOS y alerta admin.
-- ============================================================

create or replace function public.registrar_sos(
  p_recorrido_id uuid,
  p_camion_id uuid,
  p_chofer_id uuid,
  p_dispositivo_id uuid,
  p_origen text,
  p_mensaje text,
  p_latitud double precision,
  p_longitud double precision
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sos_id uuid;
begin
  insert into public.eventos_sos (
    recorrido_id,
    camion_id,
    chofer_id,
    dispositivo_id,
    origen,
    mensaje,
    latitud,
    longitud
  )
  values (
    p_recorrido_id,
    p_camion_id,
    p_chofer_id,
    p_dispositivo_id,
    p_origen,
    p_mensaje,
    p_latitud,
    p_longitud
  )
  returning id into v_sos_id;

  perform public.crear_alerta_admin(
    'sos',
    'Alerta SOS',
    coalesce(p_mensaje, 'Se recibió una alerta SOS desde una unidad.'),
    p_camion_id,
    p_recorrido_id,
    p_chofer_id,
    p_dispositivo_id,
    p_latitud,
    p_longitud,
    jsonb_build_object('sos_id', v_sos_id, 'origen', p_origen)
  );

  return v_sos_id;
end;
$$;


-- ============================================================
-- 21. FUNCIÓN: ESTIMAR CONSUMO DEL RECORRIDO
-- Usa el rango 60-90 litros diarios como estimación preliminar.
-- ============================================================

create or replace function public.estimar_consumo_recorrido(
  p_recorrido_id uuid
)
returns table (
  recorrido_id uuid,
  camion_id uuid,
  litros_estimados_min numeric,
  litros_estimados_max numeric,
  observacion text
)
language sql
stable
set search_path = public
as $$
  select
    r.id as recorrido_id,
    c.id as camion_id,
    coalesce(c.consumo_min_litros_dia, 60.00) as litros_estimados_min,
    coalesce(c.consumo_max_litros_dia, 90.00) as litros_estimados_max,
    'Estimación preliminar basada en consumo diario esperado; no representa medición real.' as observacion
  from public.recorridos r
  join public.camiones c on c.id = r.camion_id
  where r.id = p_recorrido_id;
$$;


-- ============================================================
-- 22. FUNCIÓN: DOMICILIOS AFECTADOS POR RUTA
-- Sirve para enviar push a usuarios afectados por aviso/reporte.
-- ============================================================

create or replace function public.obtener_domicilios_afectados_por_ruta(
  p_ruta_id uuid
)
returns table (
  domicilio_id uuid,
  usuario_id uuid,
  push_token text,
  alias text,
  colonia_id uuid
)
language sql
stable
set search_path = public
as $$
  select
    d.id as domicilio_id,
    d.usuario_id,
    du.push_token,
    d.alias,
    d.colonia_id
  from public.domicilios_usuario d
  join public.dispositivos_usuario du on du.usuario_id = d.usuario_id
  where d.ruta_id = p_ruta_id
    and d.activo = true
    and d.recibir_notificaciones = true
    and du.activo = true
    and du.push_token is not null;
$$;


-- ============================================================
-- 23. VISTAS ADMINISTRATIVAS NUEVAS
-- ============================================================

create or replace view public.vista_gps_estado_camiones as
select
  c.id as camion_id,
  c.clave as camion,
  c.nombre,
  d.id as dispositivo_id,
  d.nombre as dispositivo,
  d.fuente,
  d.estado,
  d.prioridad,
  d.ultima_conexion,
  extract(epoch from (now() - d.ultima_conexion)) / 60 as minutos_sin_senal
from public.camiones c
left join public.dispositivos_gps d on d.camion_id = c.id
where c.estado = 'activo';

create or replace view public.vista_domicilios_usuario as
select
  d.id as domicilio_id,
  d.usuario_id,
  p.nombre as usuario,
  p.correo,
  d.alias,
  d.tipo,
  c.nombre as colonia,
  r.route_id,
  r.nombre as ruta,
  d.recibir_notificaciones,
  d.minutos_anticipacion,
  d.activo
from public.domicilios_usuario d
join public.perfiles p on p.id = d.usuario_id
left join public.colonias c on c.id = d.colonia_id
left join public.rutas r on r.id = d.ruta_id;

create or replace view public.vista_alertas_admin_pendientes as
select
  a.id,
  a.tipo,
  a.estado,
  a.titulo,
  a.mensaje,
  c.clave as camion,
  p.nombre as chofer,
  a.creado_en
from public.alertas_admin a
left join public.camiones c on c.id = a.camion_id
left join public.perfiles p on p.id = a.chofer_id
where a.estado in ('nueva', 'vista', 'en_revision')
order by a.creado_en desc;

-- ============================================================
-- USUARIOS ANÓNIMOS / MODO INVITADO CON RESTRICCIONES
-- ============================================================

-- ============================================================
-- 1. ENUM PARA TIPO DE SESIÓN ANÓNIMA
-- ============================================================

do $$ begin
  create type public.tipo_sesion_anonima as enum (
    'invitado',
    'consulta_publica',
    'temporal'
  );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- 2. ENUM PARA EVENTOS DEL USUARIO ANÓNIMO
-- Sirve para analítica básica sin guardar identidad real.
-- ============================================================

do $$ begin
  create type public.tipo_evento_anonimo as enum (
    'consulta_colonia',
    'consulta_horario',
    'consulta_ubicacion_camion',
    'consulta_aviso',
    'intento_registrar_domicilio',
    'intento_activar_notificaciones',
    'conversion_a_registrado'
  );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- 3. SESIONES ANÓNIMAS
-- No representan usuarios registrados.
-- No deben poder guardar domicilios ni recibir notificaciones personalizadas.
-- ============================================================

create table if not exists public.sesiones_anonimas (
  id uuid primary key default gen_random_uuid(),

  -- Identificador temporal generado por la app.
  -- Puede guardarse en AsyncStorage/SecureStore del dispositivo.
  session_token text not null unique,

  tipo public.tipo_sesion_anonima not null default 'invitado',

  -- Colonia seleccionada manualmente por el usuario anónimo.
  -- No es domicilio, solo zona de consulta.
  colonia_id uuid references public.colonias(id) on delete set null,

  -- Ruta pública asociada a la colonia seleccionada.
  ruta_id uuid references public.rutas(id) on delete set null,

  plataforma text, -- ios, android, web
  app_version text,
  modelo_dispositivo text,

  -- Restricciones explícitas del modo anónimo
  puede_registrar_domicilio boolean not null default false,
  puede_recibir_push_personalizado boolean not null default false,
  puede_guardar_multiples_colonias boolean not null default false,
  puede_reportar_incidencias boolean not null default false,

  -- Solo puede consultar ubicación si el camión está dentro/cerca de su colonia.
  solo_ver_camion_en_colonia boolean not null default true,

  activo boolean not null default true,
  ultimo_uso_en timestamptz default now(),
  expira_en timestamptz default (now() + interval '30 days'),

  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_sesiones_anonimas_token
on public.sesiones_anonimas(session_token);

create index if not exists idx_sesiones_anonimas_colonia
on public.sesiones_anonimas(colonia_id);

create index if not exists idx_sesiones_anonimas_ruta
on public.sesiones_anonimas(ruta_id);

drop trigger if exists trg_sesiones_anonimas_updated_at on public.sesiones_anonimas;
create trigger trg_sesiones_anonimas_updated_at
before update on public.sesiones_anonimas
for each row execute function public.set_updated_at();


-- ============================================================
-- 4. EVENTOS DE USO ANÓNIMO
-- Guarda actividad mínima para saber qué consultan los invitados,
-- sin asociar datos personales ni domicilios.
-- ============================================================

create table if not exists public.eventos_anonimos (
  id uuid primary key default gen_random_uuid(),

  sesion_anonima_id uuid references public.sesiones_anonimas(id) on delete cascade,

  tipo public.tipo_evento_anonimo not null,

  colonia_id uuid references public.colonias(id) on delete set null,
  ruta_id uuid references public.rutas(id) on delete set null,

  datos jsonb not null default '{}'::jsonb,

  creado_en timestamptz not null default now()
);

create index if not exists idx_eventos_anonimos_sesion
on public.eventos_anonimos(sesion_anonima_id, creado_en desc);

create index if not exists idx_eventos_anonimos_tipo
on public.eventos_anonimos(tipo);

create index if not exists idx_eventos_anonimos_colonia
on public.eventos_anonimos(colonia_id);


-- ============================================================
-- 5. FUNCIÓN: CREAR O ACTUALIZAR SESIÓN ANÓNIMA
-- La app puede llamar esta función al iniciar en modo invitado.
-- ============================================================

create or replace function public.registrar_sesion_anonima(
  p_session_token text,
  p_colonia_id uuid default null,
  p_plataforma text default null,
  p_app_version text default null,
  p_modelo_dispositivo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion_id uuid;
  v_ruta_id uuid;
begin
  -- Buscar ruta activa asociada a la colonia, si existe.
  select cr.ruta_id
  into v_ruta_id
  from public.colonia_rutas cr
  where cr.colonia_id = p_colonia_id
    and cr.activo = true
  limit 1;

  insert into public.sesiones_anonimas (
    session_token,
    colonia_id,
    ruta_id,
    plataforma,
    app_version,
    modelo_dispositivo,
    ultimo_uso_en,
    expira_en
  )
  values (
    p_session_token,
    p_colonia_id,
    v_ruta_id,
    p_plataforma,
    p_app_version,
    p_modelo_dispositivo,
    now(),
    now() + interval '30 days'
  )
  on conflict (session_token)
  do update set
    colonia_id = excluded.colonia_id,
    ruta_id = excluded.ruta_id,
    plataforma = coalesce(excluded.plataforma, public.sesiones_anonimas.plataforma),
    app_version = coalesce(excluded.app_version, public.sesiones_anonimas.app_version),
    modelo_dispositivo = coalesce(excluded.modelo_dispositivo, public.sesiones_anonimas.modelo_dispositivo),
    ultimo_uso_en = now(),
    expira_en = now() + interval '30 days',
    actualizado_en = now()
  returning id into v_sesion_id;

  return v_sesion_id;
end;
$$;


-- ============================================================
-- 6. FUNCIÓN: REGISTRAR EVENTO ANÓNIMO
-- Útil para saber si el usuario intentó usar funciones restringidas.
-- ============================================================

create or replace function public.registrar_evento_anonimo(
  p_session_token text,
  p_tipo public.tipo_evento_anonimo,
  p_datos jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion_id uuid;
  v_colonia_id uuid;
  v_ruta_id uuid;
begin
  select id, colonia_id, ruta_id
  into v_sesion_id, v_colonia_id, v_ruta_id
  from public.sesiones_anonimas
  where session_token = p_session_token
    and activo = true
    and expira_en > now();

  if v_sesion_id is null then
    return;
  end if;

  insert into public.eventos_anonimos (
    sesion_anonima_id,
    tipo,
    colonia_id,
    ruta_id,
    datos
  )
  values (
    v_sesion_id,
    p_tipo,
    v_colonia_id,
    v_ruta_id,
    coalesce(p_datos, '{}'::jsonb)
  );

  update public.sesiones_anonimas
  set ultimo_uso_en = now(),
      actualizado_en = now()
  where id = v_sesion_id;
end;
$$;


-- ============================================================
-- 7. FUNCIÓN: CONSULTA LIMITADA DE UBICACIÓN DEL CAMIÓN
-- El usuario anónimo solo ve la ubicación si:
-- - tiene sesión activa
-- - seleccionó colonia
-- - la colonia tiene ruta activa
-- - hay recorrido activo
-- - el camión ya está en punto de proximidad o dentro de la zona
--
-- No expone mapa completo ni todos los checkpoints.
-- ============================================================

create or replace function public.obtener_camion_para_anonimo(
  p_session_token text
)
returns table (
  puede_ver boolean,
  motivo text,
  colonia_id uuid,
  ruta_id uuid,
  recorrido_id uuid,
  camion_id uuid,
  latitud double precision,
  longitud double precision,
  velocidad_kmh numeric,
  ultima_actualizacion timestamptz,
  mensaje text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion record;
  v_recorrido record;
  v_ubicacion record;
  v_position_id int;
  v_es_punto_proximidad boolean;
begin
  select *
  into v_sesion
  from public.sesiones_anonimas
  where session_token = p_session_token
    and activo = true
    and expira_en > now();

  if v_sesion.id is null then
    return query
    select
      false,
      'Sesión anónima no válida o expirada',
      null::uuid,
      null::uuid,
      null::uuid,
      null::uuid,
      null::double precision,
      null::double precision,
      null::numeric,
      null::timestamptz,
      'Para consultar la ubicación, selecciona nuevamente tu colonia.';
    return;
  end if;

  if v_sesion.colonia_id is null or v_sesion.ruta_id is null then
    return query
    select
      false,
      'No hay colonia o ruta seleccionada',
      v_sesion.colonia_id,
      v_sesion.ruta_id,
      null::uuid,
      null::uuid,
      null::double precision,
      null::double precision,
      null::numeric,
      null::timestamptz,
      'Selecciona tu colonia para consultar el horario y disponibilidad del camión.';
    return;
  end if;

  -- Buscar recorrido activo de la ruta seleccionada.
  select r.*
  into v_recorrido
  from public.recorridos r
  where r.ruta_id = v_sesion.ruta_id
    and r.estado in ('en_ruta', 'activo', 'iniciado')
  order by r.creado_en desc
  limit 1;

  if v_recorrido.id is null then
    return query
    select
      false,
      'No hay recorrido activo para la ruta',
      v_sesion.colonia_id,
      v_sesion.ruta_id,
      null::uuid,
      null::uuid,
      null::double precision,
      null::double precision,
      null::numeric,
      null::timestamptz,
      'Aún no hay un camión activo para tu colonia. Consulta el horario estimado.';
    return;
  end if;

  -- Obtener ubicación actual del camión.
  select ua.*
  into v_ubicacion
  from public.ubicaciones_actuales ua
  where ua.recorrido_id = v_recorrido.id
     or ua.camion_id = v_recorrido.camion_id
  order by ua.actualizado_en desc
  limit 1;

  if v_ubicacion.id is null then
    return query
    select
      false,
      'No hay ubicación actual disponible',
      v_sesion.colonia_id,
      v_sesion.ruta_id,
      v_recorrido.id,
      v_recorrido.camion_id,
      null::double precision,
      null::double precision,
      null::numeric,
      null::timestamptz,
      'El camión está en ruta, pero aún no hay señal GPS disponible.';
    return;
  end if;

  v_position_id := v_recorrido.ultimo_position_id;

  select coalesce(rp.es_punto_proximidad, false)
  into v_es_punto_proximidad
  from public.ruta_posiciones rp
  where rp.ruta_id = v_sesion.ruta_id
    and rp.position_id = v_position_id
  limit 1;

  -- Regla principal:
  -- Invitado solo ve el camión cuando ya entró a la colonia o llegó al punto previo.
  if coalesce(v_es_punto_proximidad, false) = false then
    return query
    select
      false,
      'El camión aún no está en zona visible para usuario anónimo',
      v_sesion.colonia_id,
      v_sesion.ruta_id,
      v_recorrido.id,
      v_recorrido.camion_id,
      null::double precision,
      null::double precision,
      null::numeric,
      null::timestamptz,
      'El camión todavía no está cerca de tu colonia. Se mostrará cuando entre a la zona de servicio.';
    return;
  end if;

  perform public.registrar_evento_anonimo(
    p_session_token,
    'consulta_ubicacion_camion',
    jsonb_build_object(
      'recorrido_id', v_recorrido.id,
      'camion_id', v_recorrido.camion_id,
      'position_id', v_position_id
    )
  );

  return query
  select
    true,
    'Ubicación visible para modo invitado',
    v_sesion.colonia_id,
    v_sesion.ruta_id,
    v_recorrido.id,
    v_recorrido.camion_id,
    v_ubicacion.latitud,
    v_ubicacion.longitud,
    v_ubicacion.velocidad_kmh,
    v_ubicacion.actualizado_en,
    'El camión ya se encuentra cerca de tu colonia.';
end;
$$;


-- ============================================================
-- 8. VISTA PÚBLICA PARA CONSULTA ANÓNIMA DE COLONIAS Y HORARIOS
-- No muestra domicilios, usuarios ni datos privados.
-- ============================================================

create or replace view public.vista_publica_colonias_horarios as
select
  c.id as colonia_id,
  c.nombre as colonia,
  r.id as ruta_id,
  r.route_id,
  r.nombre as ruta,
  cr.horario_estimado,
  cr.hora_inicio_estimada,
  cr.hora_fin_estimada
from public.colonia_rutas cr
join public.colonias c on c.id = cr.colonia_id
join public.rutas r on r.id = cr.ruta_id
where cr.activo = true
  and r.activo = true;


-- ============================================================
-- 9. VISTA DE PERMISOS POR TIPO DE USUARIO
-- Útil para que Flutter muestre/oculte funciones.
-- ============================================================

create or replace view public.vista_permisos_modo_usuario as
select
  'anonimo'::text as modo_usuario,
  false as puede_registrar_domicilio,
  false as puede_guardar_multiples_domicilios,
  false as puede_recibir_notificaciones_push,
  false as puede_configurar_alertas_domicilio,
  false as puede_reportar_incidencias,
  true as puede_ver_horarios_publicos,
  true as puede_ver_avisos_publicos,
  true as puede_ver_guia_separacion,
  true as puede_ver_camion_solo_en_colonia
union all
select
  'ciudadano_registrado'::text as modo_usuario,
  true as puede_registrar_domicilio,
  true as puede_guardar_multiples_domicilios,
  true as puede_recibir_notificaciones_push,
  true as puede_configurar_alertas_domicilio,
  true as puede_reportar_incidencias,
  true as puede_ver_horarios_publicos,
  true as puede_ver_avisos_publicos,
  true as puede_ver_guia_separacion,
  false as puede_ver_camion_solo_en_colonia;


-- ============================================================
-- 10. RLS PARA TABLAS ANÓNIMAS
-- ============================================================

alter table public.sesiones_anonimas enable row level security;
alter table public.eventos_anonimos enable row level security;


-- Las sesiones anónimas no se consultan directamente desde el cliente.
-- Se manejan por RPC para evitar exponer tokens o sesiones.
drop policy if exists "admin_ve_sesiones_anonimas" on public.sesiones_anonimas;
create policy "admin_ve_sesiones_anonimas"
on public.sesiones_anonimas
for select
using (public.obtener_rol_usuario() = 'admin');


drop policy if exists "admin_ve_eventos_anonimos" on public.eventos_anonimos;
create policy "admin_ve_eventos_anonimos"
on public.eventos_anonimos
for select
using (public.obtener_rol_usuario() = 'admin');


-- ============================================================
-- 11. POLÍTICAS PÚBLICAS DE LECTURA LIMITADA
-- ============================================================

-- Permite consultar horarios públicos por colonia.
-- Esta vista no contiene datos personales.
grant select on public.vista_publica_colonias_horarios to anon;
grant select on public.vista_publica_colonias_horarios to authenticated;

-- Permite consultar matriz de permisos desde la app.
grant select on public.vista_permisos_modo_usuario to anon;
grant select on public.vista_permisos_modo_usuario to authenticated;


-- ============================================================
-- 12. GRANTS RPC PARA USUARIO ANÓNIMO
-- ============================================================

grant execute on function public.registrar_sesion_anonima(
  text,
  uuid,
  text,
  text,
  text
) to anon;

grant execute on function public.registrar_evento_anonimo(
  text,
  public.tipo_evento_anonimo,
  jsonb
) to anon;

grant execute on function public.obtener_camion_para_anonimo(
  text
) to anon;


-- También disponibles para usuarios autenticados si quieren usarse antes de login.
grant execute on function public.registrar_sesion_anonima(
  text,
  uuid,
  text,
  text,
  text
) to authenticated;

grant execute on function public.registrar_evento_anonimo(
  text,
  public.tipo_evento_anonimo,
  jsonb
) to authenticated;

grant execute on function public.obtener_camion_para_anonimo(
  text
) to authenticated;


-- ============================================================
-- 24. RLS PARA NUEVAS TABLAS
-- ============================================================

alter table public.rutas enable row level security;
alter table public.ruta_posiciones enable row level security;
alter table public.colonia_rutas enable row level security;
alter table public.domicilios_usuario enable row level security;
alter table public.dispositivos_usuario enable row level security;
alter table public.gps_ingestas enable row level security;
alter table public.alertas_admin enable row level security;
alter table public.reportes_chofer enable row level security;
alter table public.eventos_sos enable row level security;
alter table public.plantillas_notificacion enable row level security;
alter table public.notificaciones_enviadas enable row level security;
alter table public.consumo_combustible enable row level security;


-- ============================================================
-- 25. POLÍTICAS PARA CIUDADANO REGISTRADO
-- ============================================================

drop policy if exists "usuario_gestiona_sus_domicilios" on public.domicilios_usuario;
create policy "usuario_gestiona_sus_domicilios"
on public.domicilios_usuario
for all
using (
  usuario_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
)
with check (
  usuario_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
);

drop policy if exists "usuario_gestiona_sus_dispositivos" on public.dispositivos_usuario;
create policy "usuario_gestiona_sus_dispositivos"
on public.dispositivos_usuario
for all
using (
  usuario_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
)
with check (
  usuario_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
);

drop policy if exists "usuario_ve_sus_notificaciones" on public.notificaciones_enviadas;
create policy "usuario_ve_sus_notificaciones"
on public.notificaciones_enviadas
for select
using (
  usuario_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
);


-- ============================================================
-- 26. POLÍTICAS PÚBLICAS DE LECTURA
-- ============================================================

drop policy if exists "public_select_rutas" on public.rutas;
create policy "public_select_rutas"
on public.rutas
for select
using (activo = true);

drop policy if exists "public_select_ruta_posiciones" on public.ruta_posiciones;
create policy "public_select_ruta_posiciones"
on public.ruta_posiciones
for select
using (true);

drop policy if exists "public_select_colonia_rutas" on public.colonia_rutas;
create policy "public_select_colonia_rutas"
on public.colonia_rutas
for select
using (activo = true);

drop policy if exists "public_select_plantillas_notificacion" on public.plantillas_notificacion;
create policy "public_select_plantillas_notificacion"
on public.plantillas_notificacion
for select
using (activo = true);


-- ============================================================
-- 27. POLÍTICAS ADMIN
-- ============================================================

drop policy if exists "admin_gestiona_rutas" on public.rutas;
create policy "admin_gestiona_rutas"
on public.rutas
for all
using (public.obtener_rol_usuario() = 'admin')
with check (public.obtener_rol_usuario() = 'admin');

drop policy if exists "admin_gestiona_ruta_posiciones" on public.ruta_posiciones;
create policy "admin_gestiona_ruta_posiciones"
on public.ruta_posiciones
for all
using (public.obtener_rol_usuario() = 'admin')
with check (public.obtener_rol_usuario() = 'admin');

drop policy if exists "admin_gestiona_colonia_rutas" on public.colonia_rutas;
create policy "admin_gestiona_colonia_rutas"
on public.colonia_rutas
for all
using (public.obtener_rol_usuario() = 'admin')
with check (public.obtener_rol_usuario() = 'admin');

drop policy if exists "admin_gestiona_alertas" on public.alertas_admin;
create policy "admin_gestiona_alertas"
on public.alertas_admin
for all
using (public.obtener_rol_usuario() = 'admin')
with check (public.obtener_rol_usuario() = 'admin');

drop policy if exists "admin_gestiona_consumo" on public.consumo_combustible;
create policy "admin_gestiona_consumo"
on public.consumo_combustible
for all
using (public.obtener_rol_usuario() = 'admin')
with check (public.obtener_rol_usuario() = 'admin');

drop policy if exists "admin_ve_gps_ingestas" on public.gps_ingestas;
create policy "admin_ve_gps_ingestas"
on public.gps_ingestas
for select
using (public.obtener_rol_usuario() = 'admin');


-- ============================================================
-- 28. POLÍTICAS CHOFER
-- ============================================================

drop policy if exists "chofer_crea_reportes" on public.reportes_chofer;
create policy "chofer_crea_reportes"
on public.reportes_chofer
for insert
with check (
  chofer_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
);

drop policy if exists "chofer_ve_sus_reportes" on public.reportes_chofer;
create policy "chofer_ve_sus_reportes"
on public.reportes_chofer
for select
using (
  chofer_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
);

drop policy if exists "chofer_crea_sos" on public.eventos_sos;
create policy "chofer_crea_sos"
on public.eventos_sos
for insert
with check (
  chofer_id = auth.uid()
  or public.obtener_rol_usuario() = 'admin'
);

drop policy if exists "admin_ve_sos" on public.eventos_sos;
create policy "admin_ve_sos"
on public.eventos_sos
for select
using (public.obtener_rol_usuario() = 'admin');


-- ============================================================
-- 29. GRANTS RPC
-- ============================================================

grant execute on function public.registrar_ingesta_gps(
  uuid,
  uuid,
  uuid,
  public.fuente_ubicacion,
  double precision,
  double precision,
  numeric,
  numeric,
  int,
  timestamptz,
  jsonb
) to authenticated;

grant execute on function public.crear_alerta_admin(
  public.tipo_alerta_admin,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  double precision,
  double precision,
  jsonb
) to authenticated;

grant execute on function public.registrar_sos(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  double precision,
  double precision
) to authenticated;

grant execute on function public.estimar_consumo_recorrido(uuid) to authenticated;

grant execute on function public.obtener_domicilios_afectados_por_ruta(uuid) to authenticated;


-- ============================================================
-- 30. REALTIME
-- Si alguna tabla ya está agregada, Supabase puede marcar error.
-- En ese caso, actívala desde Dashboard > Database > Publications.
-- ============================================================

alter publication supabase_realtime add table public.ubicaciones_actuales;
alter publication supabase_realtime add table public.recorridos;
alter publication supabase_realtime add table public.avisos;
alter publication supabase_realtime add table public.reportes_ciudadanos;
alter publication supabase_realtime add table public.alertas_admin;
alter publication supabase_realtime add table public.reportes_chofer;
alter publication supabase_realtime add table public.eventos_sos;