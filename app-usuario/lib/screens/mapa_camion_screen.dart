import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';

class MapaCamionScreen extends StatefulWidget {
  const MapaCamionScreen({Key? key}) : super(key: key);

  @override
  State<MapaCamionScreen> createState() => _MapaCamionScreenState();
}

class _MapaCamionScreenState extends State<MapaCamionScreen> {
  final MapController _mapController = MapController();
  Timer? _timer;
  
  LatLng? _camionLocation;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCamionLocation();
    // ==========================================
    // CAMBIA AQUÍ EL TIEMPO DE SONDEO (POLLING)
    // Actualmente configurado a 5 segundos temporalmente.
    // Puedes cambiar 'seconds: 5' por el número que gustes.
    // ==========================================
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _fetchCamionLocation();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchCamionLocation() async {
    try {
      final response = await Supabase.instance.client
          .from('gps_carrito')
          .select()
          .order('creado_en', ascending: false)
          .limit(1);

      if(response != null){
        print('Response: $response');
      }
      
      if (response != null && response.isNotEmpty) {
        final data = response.first;
        
        // Manejar diferentes nombres comunes de columnas
        final lat = data['latitud'] ?? data['lat'] ?? data['latitude'];
        final lng = data['longitud'] ?? data['lng'] ?? data['longitude'] ?? data['lon'];

        if (lat != null && lng != null) {
          final newLocation = LatLng(
            double.parse(lat.toString()), 
            double.parse(lng.toString())
          );
          
          if (mounted) {
            setState(() {
              _camionLocation = newLocation;
              _isLoading = false;
              _error = null;
            });
          }
        } else {
          if (mounted) {
            setState(() {
              _error = 'El registro no contiene datos de latitud/longitud válidos.';
              _isLoading = false;
            });
          }
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'No hay datos de ubicación disponibles para el camión.';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching GPS_carrito: $e');
      if (mounted) {
        setState(() {
          _error = 'Error de conexión:\n$e';
          _isLoading = false;
        });
      }
    }
  }

  void _centrarCamion() {
    if (_camionLocation != null) {
      _mapController.move(_camionLocation!, 16.0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGrayBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: _buildBody(),
            ),
          ],
        ),
      ),
      floatingActionButton: _camionLocation != null
          ? FloatingActionButton(
              onPressed: _centrarCamion,
              backgroundColor: AppColors.primaryBlue,
              child: const Icon(Icons.my_location, color: Colors.white),
            )
          : null,
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      color: Colors.white,
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.lightGrayBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.arrow_back_ios_new, size: 18),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ubicación del Camión',
                  style: GoogleFonts.poppins(
                    fontSize: 18, 
                    fontWeight: FontWeight.bold, 
                    color: AppColors.primaryBlue
                  )
                ),
                Text(
                  _camionLocation != null ? 'Actualizado en tiempo real' : 'Buscando señal GPS...',
                  style: TextStyle(
                    fontSize: 12,
                    color: _camionLocation != null ? AppColors.aquaGreen : Colors.orange,
                  ),
                ),
              ],
            ),
          ),
          if (_isLoading)
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryBlue),
            )
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_error != null && _camionLocation == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.gps_off, size: 60, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey, fontSize: 16),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _fetchCamionLocation();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: Colors.white,
                ),
              )
            ],
          ),
        ),
      );
    }

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _camionLocation ?? const LatLng(20.5223, -100.8123), // Celaya default
        initialZoom: 15.0,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.hackathon.recolectacelaya',
        ),
        if (_camionLocation != null)
          MarkerLayer(
            markers: [
              Marker(
                point: _camionLocation!,
                width: 60,
                height: 60,
                child: _buildCamionMarker(),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildCamionMarker() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.aquaGreen,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Center(
        child: Icon(
          Icons.local_shipping,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }
}
