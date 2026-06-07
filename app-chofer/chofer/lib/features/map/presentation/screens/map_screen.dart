import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';
import 'package:recolecta_chofer/core/widgets/app_bottom_nav.dart';
import 'package:recolecta_chofer/core/widgets/status_pill.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  LatLng _currentPosition = const LatLng(20.5234, -100.8152);
  bool _isTracking = false;
  double _speedKmh = 0.0;
  double _distanceKm = 0.0;
  LatLng? _lastPosition;
  StreamSubscription<Position>? _positionStream;
  final MapController _mapController = MapController();
  final _distance = const Distance();

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _startGps();
  }

  Future<void> _startGps() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        if (mounted) {
          setState(() {
            _currentPosition = LatLng(pos.latitude, pos.longitude);
          });
          _mapController.move(_currentPosition, 16.0);
        }

        _positionStream = Geolocator.getPositionStream(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 5),
        ).listen((Position position) {
          if (mounted) {
            final newPos = LatLng(position.latitude, position.longitude);
            // Acumular distancia recorrida
            double addedKm = 0;
            if (_lastPosition != null) {
              addedKm = _distance.as(LengthUnit.Kilometer, _lastPosition!, newPos);
            }
            setState(() {
              _currentPosition = newPos;
              _lastPosition = newPos;
              _isTracking = true;
              // speed en m/s -> km/h
              _speedKmh = (position.speed > 0) ? position.speed * 3.6 : _speedKmh;
              _distanceKm += addedKm;
            });
            _mapController.move(_currentPosition, 16.0);
          }
        });
      }
    } catch (e) {
      print('Error starting GPS: $e');
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _positionStream?.cancel();
    super.dispose();
  }

  void _showGpsSourceDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Fuente GPS', style: AppTextStyles.heading3),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _GpsSourceOption(label: 'Módulo interno', isSelected: true),
            const SizedBox(height: 8),
            _GpsSourceOption(label: 'GPS del celular', isSelected: false),
            const SizedBox(height: 8),
            _GpsSourceOption(label: 'Sin GPS (manual)', isSelected: false),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cerrar', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
          ),
        ],
      ),
    );
  }

  void _showSosDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.warning_rounded, color: AppColors.redDanger),
            const SizedBox(width: 8),
            Text('Enviar SOS', style: AppTextStyles.heading3.copyWith(color: AppColors.redDanger)),
          ],
        ),
        content: Text(
          'Se enviará una alerta de emergencia con tu ubicación actual al centro de control. ¿Confirmas?',
          style: AppTextStyles.bodyMuted,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancelar', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.redButton,
              minimumSize: const Size(0, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Enviar SOS', style: AppTextStyles.body.copyWith(color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GPS en vivo'),
        automaticallyImplyLeading: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: StatusPill(label: _isTracking ? 'GPS activo' : 'Buscando GPS', color: _isTracking ? AppColors.greenActive : AppColors.amberAlert),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Mapa Real
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                height: 350,
                width: double.infinity,
                child: Stack(
                  children: [
                    FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: _currentPosition,
                        initialZoom: 15.0,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.recolecta.chofer',
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: _currentPosition,
                              width: 60,
                              height: 60,
                              child: AnimatedBuilder(
                                animation: _pulseAnimation,
                                builder: (context, child) {
                                  return Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Transform.scale(
                                        scale: _pulseAnimation.value,
                                        child: Container(
                                          width: 50,
                                          height: 50,
                                          decoration: BoxDecoration(
                                            color: AppColors.greenActive.withOpacity(0.25),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      ),
                                      const CircleAvatar(
                                        backgroundColor: AppColors.greenButton,
                                        radius: 18,
                                        child: Icon(
                                          Icons.local_shipping,
                                          color: AppColors.textPrimary,
                                          size: 18,
                                        ),
                                      ),
                                    ],
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    // Coordenadas overlay (superior izquierdo)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.surface.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Text(
                          '${_currentPosition.latitude.toStringAsFixed(4)}° N, ${_currentPosition.longitude.toStringAsFixed(4)}° W',
                          style: AppTextStyles.badge.copyWith(
                            color: AppColors.greenActive,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Métricas
            _MetricsRow(speedKmh: _speedKmh, distanceKm: _distanceKm),
            const SizedBox(height: 12),

            // Card GPS source
            _GpsSourceCard(onChangeTap: _showGpsSourceDialog),
            const SizedBox(height: 12),

            // SOS card
            _SosCard(onSosTap: _showSosDialog),
            const SizedBox(height: 16),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
    );
  }
}

// ─── Métricas ────────────────────────────────────────────────────────────────

class _MetricsRow extends StatelessWidget {
  final double speedKmh;
  final double distanceKm;
  const _MetricsRow({required this.speedKmh, required this.distanceKm});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _MetricCard(icon: Icons.speed, label: 'Velocidad', value: '${speedKmh.toStringAsFixed(0)} km/h', color: AppColors.blueInfo)),
        const SizedBox(width: 8),
        Expanded(child: _MetricCard(icon: Icons.access_time, label: 'Prox. parada', value: '~-- min', color: AppColors.amberAlert)),
        const SizedBox(width: 8),
        Expanded(child: _MetricCard(icon: Icons.straighten, label: 'Distancia', value: '${distanceKm.toStringAsFixed(1)} km', color: AppColors.greenActive)),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(value, style: AppTextStyles.heading3.copyWith(fontSize: 14)),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.label, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

// ─── GPS Source Card ─────────────────────────────────────────────────────────

class _GpsSourceCard extends StatelessWidget {
  const _GpsSourceCard({required this.onChangeTap});
  final VoidCallback onChangeTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blueInfo.withOpacity(0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.blueInfo.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.gps_fixed, color: AppColors.blueInfo, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Fuente GPS activa', style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                StatusPill(
                  label: 'Módulo interno',
                  backgroundColor: AppColors.blueInfo.withOpacity(0.15),
                  textColor: AppColors.blueInfo,
                  dotColor: AppColors.blueInfo, color: AppColors.surface,
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: onChangeTap,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.blueInfo,
              side: const BorderSide(color: AppColors.blueInfo),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: const Size(0, 36),
            ),
            child: Text('Cambiar fuente', style: AppTextStyles.badge.copyWith(color: AppColors.blueInfo)),
          ),
        ],
      ),
    );
  }
}

// ─── SOS Card ────────────────────────────────────────────────────────────────

class _SosCard extends StatelessWidget {
  const _SosCard({required this.onSosTap});
  final VoidCallback onSosTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.redDanger.withOpacity(0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.redDanger.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.emergency, color: AppColors.redDanger, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Emergencia en ruta', style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600)),
                Text('Envía alerta inmediata al control', style: AppTextStyles.bodyMuted.copyWith(fontSize: 12)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onSosTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.redButton,
              minimumSize: const Size(0, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            child: Text('SOS', style: AppTextStyles.heading3.copyWith(color: AppColors.textPrimary, fontSize: 15)),
          ),
        ],
      ),
    );
  }
}

class _GpsSourceOption extends StatelessWidget {
  const _GpsSourceOption({required this.label, required this.isSelected});
  final String label;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.blueInfo.withOpacity(0.1) : AppColors.backgroundPrimary,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isSelected ? AppColors.blueInfo.withOpacity(0.4) : AppColors.borderSubtle,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
            color: isSelected ? AppColors.blueInfo : AppColors.textMuted,
            size: 18,
          ),
          const SizedBox(width: 10),
          Text(label, style: AppTextStyles.body.copyWith(color: isSelected ? AppColors.textPrimary : AppColors.textSecondary)),
        ],
      ),
    );
  }
}