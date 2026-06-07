import 'package:recolecta_chofer/core/services/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ReportService {
  final SupabaseClient _supabase = SupabaseService.client;

  /// Inserta un nuevo reporte en la base de datos
  Future<void> submitReport({
    String? recorridoId,
    String? camionId,
    required String tipo,
    required String titulo,
    String? descripcion,
    double? latitud,
    double? longitud,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Usuario no autenticado');

    final data = {
      if (recorridoId != null) 'recorrido_id': recorridoId,
      if (camionId != null) 'camion_id': camionId,
      'chofer_id': userId,
      'tipo': tipo,
      'titulo': titulo,
      if (descripcion != null) 'descripcion': descripcion,
      if (latitud != null) 'latitud': latitud,
      if (longitud != null) 'longitud': longitud,
    };

    final response = await _supabase.from('reportes_chofer').insert(data).select().single();

    // Broadcast event to admin panel through a generic Realtime Channel
    _supabase.channel('admin_notifications').sendBroadcastMessage(
      event: 'new_report',
      payload: response,
    );
  }

  /// Dispara un evento SOS directo usando la función RPC
  Future<void> triggerSOS({
    String? recorridoId,
    String? camionId,
    String? dispositivoId,
    String mensaje = '¡Emergencia reportada desde App Chofer!',
    double? latitud,
    double? longitud,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Usuario no autenticado');

    final response = await _supabase.rpc('registrar_sos', params: {
      'p_recorrido_id': recorridoId,
      'p_camion_id': camionId,
      'p_chofer_id': userId,
      'p_dispositivo_id': dispositivoId,
      'p_origen': 'app_chofer',
      'p_mensaje': mensaje,
      'p_latitud': latitud,
      'p_longitud': longitud,
    });

    // Broadcast event to admin panel
    _supabase.channel('admin_notifications').sendBroadcastMessage(
      event: 'sos_alert',
      payload: {
        'sos_id': response,
        'chofer_id': userId,
        'mensaje': mensaje,
        'latitud': latitud,
        'longitud': longitud,
      },
    );
  }
}
