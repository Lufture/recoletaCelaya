import 'dart:async';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:recolecta_chofer/core/services/supabase_service.dart';

class TrackingService {
  static final TrackingService _instance = TrackingService._internal();
  factory TrackingService() => _instance;
  TrackingService._internal();

  Future<bool> get isTracking async {
    final service = FlutterBackgroundService();
    return await service.isRunning();
  }

  /// Initialize the background service
  Future<void> initializeService() async {
    final service = FlutterBackgroundService();

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'my_foreground', // id
      'Rastreo GPS', // name
      description: 'Este canal es para transmitir ubicación GPS en vivo.', // description
      importance: Importance.low, // importance must be at low or higher level
    );

    final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
        FlutterLocalNotificationsPlugin();

    if (Platform.isIOS || Platform.isAndroid) {
      await flutterLocalNotificationsPlugin.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('ic_bg_service_small'),
        ),
      );
    }

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: 'my_foreground',
        initialNotificationTitle: 'Rastreo de ruta activo',
        initialNotificationContent: 'Preparando GPS...',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  /// Request location permissions from the user
  Future<bool> requestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }

    if (permission == LocationPermission.deniedForever) return false;

    // Request always permission for background tracking
    if (permission == LocationPermission.whileInUse) {
      permission = await Geolocator.requestPermission();
    }

    return true;
  }

  /// Start tracking GPS and sending updates to Supabase
  Future<void> startTracking({
    required String recorridoId,
    required String camionId,
  }) async {
    final isRunning = await isTracking;
    if (isRunning) return;

    final hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw Exception('Permisos de ubicación no otorgados');
    }


    final service = FlutterBackgroundService();
    await service.startService();

    // Small delay to ensure isolate is running before invoking
    await Future.delayed(const Duration(seconds: 1));
    service.invoke('setTrackingData', {
      'recorridoId': recorridoId,
      'camionId': camionId,
    });
  }

  /// Stop tracking GPS
  Future<void> stopTracking() async {

    final service = FlutterBackgroundService();
    service.invoke('stopService');
  }
}

// --------------------------------------------------------
// BACKGROUND ISOLATE ENTRY POINTS
// --------------------------------------------------------

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  // Initialize for the background isolate
  DartPluginRegistrant.ensureInitialized();
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase since we're in a new isolate
  await SupabaseService.initialize();

  String? backgroundRecorridoId;
  String? backgroundCamionId;
  StreamSubscription<Position>? positionSubscription;

  // Listen to incoming data from the main isolate
  service.on('setTrackingData').listen((event) {
    if (event != null) {
      backgroundRecorridoId = event['recorridoId'] as String?;
      backgroundCamionId = event['camionId'] as String?;
      print('BG Service: Received tracking data ($backgroundRecorridoId, $backgroundCamionId)');
    }
  });

  service.on('stopService').listen((event) {
    positionSubscription?.cancel();
    service.stopSelf();
    print('BG Service: Stopped');
  });

  // Setup GPS Settings
  final locationSettings = AndroidSettings(
    accuracy: LocationAccuracy.high,
    distanceFilter: 10, // meters before update
    intervalDuration: const Duration(seconds: 10),
  );

  // Start GPS stream
  positionSubscription = Geolocator.getPositionStream(
    locationSettings: locationSettings,
  ).listen((Position position) async {

    // If we haven't received IDs from UI, try recovering them from DB based on active session
    if (backgroundRecorridoId == null || backgroundCamionId == null) {
       try {
         final session = SupabaseService.client.auth.currentSession;
         if (session == null) return;
         final response = await SupabaseService.client
            .from('recorridos')
            .select('id, camion_id')
            .eq('chofer_id', session.user.id)
            .eq('estado', 'en_ruta')
            .maybeSingle();
         if (response != null) {
            backgroundRecorridoId = response['id'];
            backgroundCamionId = response['camion_id'];
         } else {
            // No active shift, maybe we should stop?
            return;
         }
       } catch(e) {
         print('BG Error recovering IDs: $e');
         return;
       }
    }

    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title: "RecolecTA: Transmitiendo GPS",
        content: "Enviando... Vel: ${(position.speed * 3.6).toStringAsFixed(1)} km/h",
      );
    }

    try {
      await SupabaseService.client.rpc('registrar_ingesta_gps', params: {
        'p_camion_id': backgroundCamionId,
        'p_recorrido_id': backgroundRecorridoId,
        'p_dispositivo_id': null,
        'p_fuente': 'celular_chofer', // O el valor del enum que corresponda a la app
        'p_latitud': position.latitude,
        'p_longitud': position.longitude,
        'p_velocidad_kmh': position.speed * 3.6,
        'p_direccion_grados': position.heading,
        'p_position_id': null,
        'p_timestamp_origen': DateTime.now().toUtc().toIso8601String(),
        'p_payload_raw': {
          'precision_metros': position.accuracy,
          'altitud': position.altitude,
        }
      });
      print('BG Service: Enviada ubi a Supabase via registrar_ingesta_gps');
    } catch (e) {
      print('BG Error enviando ubicación a Supabase: $e');
    }
  });
}
