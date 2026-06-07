import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:recolecta_celaya/services/notification_service.dart';

class ProximityService {
  static final ProximityService _instance = ProximityService._internal();
  factory ProximityService() => _instance;
  ProximityService._internal();

  Timer? _timer;
  bool _isRunning = false;
  bool _notifiedInCurrentCycle = false;

  // Umbral en metros (~15 min a 10 km/h)
  final double umbralDistanciaMetros = 2500.0;

  void startMonitoring() {
    if (_isRunning) return;
    _isRunning = true;
    _notifiedInCurrentCycle = false;
    debugPrint("ProximityService: Monitoreo iniciado.");

    // Verifica cada 30 segundos
    _timer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      await _checkProximity();
    });
    
    // Check inicial inmediato
    _checkProximity();
  }

  void stopMonitoring() {
    _timer?.cancel();
    _isRunning = false;
    _notifiedInCurrentCycle = false;
    debugPrint("ProximityService: Monitoreo detenido.");
  }

  Future<void> _checkProximity() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        // No hay sesión activa
        return;
      }

      // 1. Obtener ubicación del usuario
      final domicilioRes = await Supabase.instance.client
          .from('domicilios_usuario')
          .select()
          .eq('usuario_id', user.id)
          .maybeSingle();

      if (domicilioRes == null || domicilioRes['latitud'] == null || domicilioRes['longitud'] == null) {
        // No hay domicilio registrado con coordenadas
        return;
      }

      final double userLat = double.parse(domicilioRes['latitud'].toString());
      final double userLng = double.parse(domicilioRes['longitud'].toString());

      // 2. Obtener ubicación del camión
      final camionRes = await Supabase.instance.client
          .from('gps_carrito')
          .select()
          .order('creado_en', ascending: false)
          .limit(1);

      if (camionRes == null || camionRes.isEmpty) {
        return;
      }

      final dataCamion = camionRes.first;
      final latData = dataCamion['latitud'] ?? dataCamion['lat'] ?? dataCamion['latitude'];
      final lngData = dataCamion['longitud'] ?? dataCamion['lng'] ?? dataCamion['longitude'] ?? dataCamion['lon'];

      if (latData == null || lngData == null) return;

      final double camionLat = double.parse(latData.toString());
      final double camionLng = double.parse(lngData.toString());

      // 3. Calcular distancia
      final double distanceInMeters = Geolocator.distanceBetween(
        userLat, userLng, camionLat, camionLng
      );

      debugPrint("ProximityService: Distancia actual -> ${distanceInMeters.toStringAsFixed(2)} m");

      // 4. Evaluar umbral
      if (distanceInMeters <= umbralDistanciaMetros) {
        if (!_notifiedInCurrentCycle) {
          // Lanzar notificación
          await NotificationService().mostrarNotificacionProximidad(
            title: "¡El camión está cerca!",
            body: "El camión de basura llegará aproximadamente en 15 minutos.",
          );
          _notifiedInCurrentCycle = true;
        }
      } else {
        // Si el camión se alejó (por ejemplo, terminó la ruta y se fue), reiniciamos la bandera
        if (_notifiedInCurrentCycle && distanceInMeters > umbralDistanciaMetros + 500) {
           _notifiedInCurrentCycle = false; // Agregamos un buffer para evitar parpadeos
        }
      }

    } catch (e) {
      debugPrint("ProximityService Error: $e");
    }
  }
}
