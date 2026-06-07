import 'dart:io';
import 'package:recolecta_chofer/core/services/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class NotificationService {
  final SupabaseClient _supabase = SupabaseService.client;

  /// Registra o actualiza el dispositivo y token push en la base de datos
  Future<void> registerDeviceToken(String pushToken) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    final plataforma = Platform.isIOS ? 'ios' : Platform.isAndroid ? 'android' : 'web';
    
    // Aquí podrías usar device_info_plus y package_info_plus para obtener datos reales
    final data = {
      'usuario_id': user.id,
      'push_token': pushToken,
      'plataforma': plataforma,
      'modelo_dispositivo': 'Desconocido', // TODO: Obtener modelo real
      'app_version': '1.0.0', // TODO: Obtener versión real
      'activo': true,
      'ultimo_uso_en': DateTime.now().toIso8601String(),
    };

    try {
      await _supabase.from('dispositivos_usuario').upsert(
        data,
        onConflict: 'usuario_id, push_token',
      );
      print('Token de notificaciones registrado exitosamente');
    } catch (e) {
      print('Error registrando token de notificaciones: $e');
    }
  }

  /// Suscribirse a los canales de notificaciones de Edge Functions si es necesario
  void setupNotifications() {
    // Si estás usando flutter_local_notifications o firebase_messaging,
    // aquí inicializarías el listener para recibir notificaciones
    // y luego llamarías a registerDeviceToken() con el token obtenido.
  }

  /// Obtiene el historial de notificaciones para el usuario actual
  Future<List<Map<String, dynamic>>> getNotifications() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await _supabase
          .from('notificaciones_enviadas')
          .select()
          .eq('usuario_id', user.id)
          .order('fecha_envio', ascending: false);
      
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  /// Marca una notificación como leída
  Future<void> markAsRead(String id) async {
    try {
      await _supabase
          .from('notificaciones_enviadas')
          .update({'leido': true})
          .eq('id', id);
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }
}
