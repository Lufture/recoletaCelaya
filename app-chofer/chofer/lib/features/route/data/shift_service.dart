import 'package:recolecta_chofer/core/services/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ShiftService {
  final SupabaseClient _client = SupabaseService.client;

  /// Gets the chofer's assigned truck from `choferes_camiones`.
  Future<Map<String, dynamic>?> getAssignedTruck() async {
    final userId = _client.auth.currentUser!.id;

    final response = await _client
        .from('choferes_camiones')
        .select('camion_id, camiones(id, clave, nombre)')
        .eq('chofer_id', userId)
        .eq('activo', true)
        .maybeSingle();

    return response;
  }

  /// Checks if there's already an active recorrido for the current chofer.
  Future<Map<String, dynamic>?> getActiveShift() async {
    final userId = _client.auth.currentUser!.id;

    final response = await _client
        .from('recorridos')
        .select('*, rutas(nombre)')
        .eq('chofer_id', userId)
        .eq('estado', 'en_ruta')
        .maybeSingle();

    return response;
  }

  /// Inserts a new recorrido with estado `en_ruta`.
  Future<Map<String, dynamic>> startShift({required String camionId}) async {
    final userId = _client.auth.currentUser!.id;
    final now = DateTime.now().toUtc().toIso8601String();

    final response = await _client
        .from('recorridos')
        .insert({
          'camion_id': camionId,
          'chofer_id': userId,
          'dia': _getCurrentDaySpanish(),
          'estado': 'en_ruta',
          'inicio_real': now,
        })
        .select()
        .single();

    return response;
  }

  /// Finalises a recorrido.
  Future<void> endShift(String recorridoId) async {
    final now = DateTime.now().toUtc().toIso8601String();

    await _client.from('recorridos').update({
      'estado': 'finalizado',
      'fin_real': now,
      'retorno_base_confirmado': true,
    }).eq('id', recorridoId);
  }

  /// Maps [DateTime.now().weekday] (1 = Monday) to Spanish day names.
  String _getCurrentDaySpanish() {
    const days = {
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado',
      7: 'domingo',
    };
    return days[DateTime.now().weekday]!;
  }

  /// Obtiene las colonias asignadas a una ruta específica.
  Future<List<Map<String, dynamic>>> getRouteColonies(String rutaId) async {
    try {
      final response = await _client
          .from('colonia_rutas')
          .select('id, horario_estimado, hora_inicio_estimada, colonias(id, nombre)')
          .eq('ruta_id', rutaId)
          .eq('activo', true)
          // Ordenamos por hora de inicio si está disponible
          .order('hora_inicio_estimada', ascending: true);
      
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching route colonies: $e');
      return [];
    }
  }
}
