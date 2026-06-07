import 'dart:convert';
import 'package:http/http.dart' as http;

class LocationService {
  // Búsqueda de direcciones usando Nominatim (OpenStreetMap)
  // Añadimos Celaya al query para mejorar los resultados locales
  static Future<List<Map<String, dynamic>>> searchAddress(String query) async {
    if (query.isEmpty) return [];

    final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?q=$query, Celaya, Guanajuato&format=json&addressdetails=1&limit=5');
    
    try {
      final response = await http.get(url, headers: {
        'User-Agent': 'RecolectaCelayaApp/1.0', // Requerido por la política de Nominatim
      });

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => {
          'display_name': item['display_name'],
          'lat': double.parse(item['lat']),
          'lon': double.parse(item['lon']),
        }).toList();
      }
    } catch (e) {
      print('Error al buscar dirección: $e');
    }
    return [];
  }

  // Geocodificación inversa (Reverse Geocoding)
  static Future<String?> reverseGeocode(double lat, double lon) async {
    final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lon&format=json&addressdetails=1');
    
    try {
      final response = await http.get(url, headers: {
        'User-Agent': 'RecolectaCelayaApp/1.0',
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['display_name'] as String?;
      }
    } catch (e) {
      print('Error en reverse geocoding: $e');
    }
    return null;
  }
}
