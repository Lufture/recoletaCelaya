// lib/features/dashboard/presentation/screens/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_routes.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';
import 'package:recolecta_chofer/core/widgets/app_bottom_nav.dart';
import 'package:recolecta_chofer/core/widgets/section_label.dart';
import 'package:recolecta_chofer/core/widgets/status_pill.dart';
import 'package:recolecta_chofer/features/auth/data/auth_service.dart';
import 'package:recolecta_chofer/features/route/data/shift_service.dart';
import 'package:recolecta_chofer/core/services/tracking_service.dart';
import 'package:recolecta_chofer/features/notifications/data/notification_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _authService = AuthService();
  final _shiftService = ShiftService();
  final _trackingService = TrackingService();
  final _notificationService = NotificationService();

  String _userName = 'Cargando...';
  String? _assignedTruckName;
  String? _assignedTruckId;
  Map<String, dynamic>? _activeShift;
  bool _isShiftLoading = false;
  bool _isInitialLoading = true;
  bool _isTracking = false;
  // Progreso de ruta
  int _routeTotal = 0;
  int _routeCompleted = 0;
  String _nextColony = '--';

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    try {
      await Future.wait([
        _loadUserProfile(),
        _loadAssignedTruck(),
        _checkActiveShift(),
      ]);
      // Registrar el dispositivo para push notifications (token simulado por ahora)
      await _notificationService.registerDeviceToken('token_simulado_v2');
    } catch (e) {
      print('Error loading data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.redDanger,
            content: Text('Error consultando DB: $e'),
            duration: const Duration(seconds: 10),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isInitialLoading = false);
      }
    }
  }

  Future<void> _loadUserProfile() async {
    final profile = await _authService.getCurrentUserProfile();
    if (mounted) {
      setState(() {
        _userName = profile?['nombre'] ?? 'Chofer';
      });
    }
  }

  Future<void> _loadAssignedTruck() async {
    final truck = await _shiftService.getAssignedTruck();
    if (mounted && truck != null) {
      final camionData = truck['camiones'];
      
      // Si camionData es null, significa que Supabase no devolvió los datos del camión
      // (usualmente porque falta la política RLS en la tabla 'camiones')
      if (camionData == null) {
        throw Exception("El registro existe pero los datos del camión (camiones) devolvieron null. Revisa las políticas RLS de la tabla 'camiones'.");
      }
      
      setState(() {
        _assignedTruckId = camionData['id'];
        _assignedTruckName = '${camionData['clave']} · ${camionData['nombre'] ?? ''}';
      });
    }
  }

  Future<void> _checkActiveShift() async {
    final shift = await _shiftService.getActiveShift();
    final isTrackingNow = await _trackingService.isTracking;

    if (mounted) {
      setState(() {
        _activeShift = shift;
        _isTracking = isTrackingNow;
      });

      // Cargar progreso de ruta si hay ruta asignada
      if (shift != null && shift['ruta_id'] != null) {
        try {
          final colonies = await _shiftService.getRouteColonies(shift['ruta_id']);
          final completed = (shift['ultimo_position_id'] ?? 0) as int;
          final nextIdx = completed < colonies.length ? completed : colonies.length - 1;
          final nextName = colonies.isNotEmpty
              ? (colonies[nextIdx]['colonias']?['nombre'] ?? '--')
              : '--';
          if (mounted) {
            setState(() {
              _routeTotal = colonies.length;
              _routeCompleted = completed;
              _nextColony = nextName;
            });
          }
        } catch (e) {
          print('Error loading route progress: $e');
        }
      }

      // Si hay turno activo pero el GPS no está corriendo, reanudarlo
      if (shift != null && !isTrackingNow) {
        try {
          await _trackingService.startTracking(
            recorridoId: shift['id'],
            camionId: shift['camion_id'],
          );
          if (mounted) setState(() => _isTracking = true);
        } catch (e) {
          // GPS permissions might be missing, we'll handle on manual start
        }
      }
    }
  }

  Future<void> _startRoute() async {
    if (_assignedTruckId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.amber,
          content: Text(
            'No tienes un camión asignado. Contacta al administrador.',
            style: AppTextStyles.body.copyWith(color: AppColors.backgroundPrimary),
          ),
        ),
      );
      return;
    }

    setState(() => _isShiftLoading = true);
    try {
      final shift = await _shiftService.startShift(camionId: _assignedTruckId!);
      await _trackingService.startTracking(
        recorridoId: shift['id'],
        camionId: shift['camion_id'],
      );
      if (mounted) {
        setState(() {
          _activeShift = shift;
          _isTracking = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.greenButton,
            content: Text(
              '¡Ruta iniciada! GPS transmitiendo en vivo.',
              style: AppTextStyles.body.copyWith(color: AppColors.textPrimary),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.redDanger,
            content: Text('Error al iniciar ruta: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isShiftLoading = false);
      }
    }
  }

  Future<void> _confirmEndShift(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('¿Finalizar turno?', style: AppTextStyles.heading3),
        content: Text(
          'Se detendrá el rastreo GPS, se registrará el fin de tu turno y serás redirigido al inicio de sesión.',
          style: AppTextStyles.bodyMuted,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancelar', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.redButton,
              minimumSize: const Size(0, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Finalizar', style: AppTextStyles.body.copyWith(color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      // Stop GPS tracking
      await _trackingService.stopTracking();
      if (mounted) setState(() => _isTracking = false);

      // End the shift in database
      if (_activeShift != null) {
        await _shiftService.endShift(_activeShift!['id']);
      }

      await _authService.signOut();
      if (mounted) {
        Navigator.pushReplacementNamed(context, AppRoutes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isOnRoute = _activeShift != null;

    return Scaffold(
      appBar: AppBar(
        title: Text('Bienvenido, $_userName'),
        automaticallyImplyLeading: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: StatusPill(
              label: isOnRoute ? 'En ruta' : 'Sin turno',
              color: isOnRoute ? const Color(0xFF4CAF50) : AppColors.textMuted,
            ),
          ),
        ],
      ),
      body: _isInitialLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.greenActive))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero card
                  _HeroCard(
                    truckName: _assignedTruckName,
                    isOnRoute: isOnRoute,
                  ),
                  const SizedBox(height: 16),

                  // GPS Status indicator (only when on route)
                  if (isOnRoute)
                    _GpsStatusCard(isTracking: _isTracking),
                  if (isOnRoute) const SizedBox(height: 16),

                  // Start Route button (only when NOT on route)
                  if (!isOnRoute)
                    _StartRouteButton(
                      isLoading: _isShiftLoading,
                      hasTruck: _assignedTruckId != null,
                      onPressed: _startRoute,
                    ),
                  if (!isOnRoute) const SizedBox(height: 20),

                  // Accesos rápidos
                  SectionLabel(text: 'Acceso rápido'),
                  _QuickAccessGrid(),
                  const SizedBox(height: 20),

                  // Progreso
                  SectionLabel(text: 'Progreso del turno'),
                  _ProgressCard(
                    total: _routeTotal,
                    completed: _routeCompleted,
                    nextColony: _nextColony,
                  ),
                  const SizedBox(height: 12),

                  // Consumo
                  _FuelCard(),
                  const SizedBox(height: 24),

                  // Finalizar turno (only when on route)
                  if (isOnRoute)
                    ElevatedButton(
                      onPressed: () => _confirmEndShift(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.redButton,
                        minimumSize: const Size(double.infinity, 52),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.stop_circle_outlined, size: 20),
                          const SizedBox(width: 8),
                          Text('Finalizar turno', style: AppTextStyles.heading3.copyWith(color: AppColors.textPrimary)),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
    );
  }
}

// ============================================================
// WIDGETS INTERNOS
// ============================================================

class _StartRouteButton extends StatelessWidget {
  final bool isLoading;
  final bool hasTruck;
  final VoidCallback onPressed;

  const _StartRouteButton({
    required this.isLoading,
    required this.hasTruck,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : const Icon(Icons.play_circle_fill, color: Colors.white, size: 30),
        label: Text(
          hasTruck ? 'INICIAR RUTA' : 'SIN CAMIÓN ASIGNADO',
          style: AppTextStyles.heading2.copyWith(color: Colors.white),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: hasTruck ? AppColors.greenButton : AppColors.textMuted,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}

class _GpsStatusCard extends StatelessWidget {
  final bool isTracking;

  const _GpsStatusCard({required this.isTracking});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isTracking
            ? AppColors.greenActive.withOpacity(0.08)
            : AppColors.redDanger.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isTracking
              ? AppColors.greenActive.withOpacity(0.3)
              : AppColors.redDanger.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isTracking
                  ? AppColors.greenActive.withOpacity(0.15)
                  : AppColors.redDanger.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isTracking ? Icons.gps_fixed : Icons.gps_off,
              color: isTracking ? AppColors.greenActive : AppColors.redDanger,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isTracking ? 'GPS transmitiendo en vivo' : 'GPS detenido',
                  style: AppTextStyles.label.copyWith(
                    color: isTracking ? AppColors.greenActive : AppColors.redDanger,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isTracking
                      ? 'Tu ubicación se envía al panel de administración'
                      : 'La ubicación no se está transmitiendo',
                  style: AppTextStyles.badge.copyWith(color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          Icon(
            isTracking ? Icons.circle : Icons.circle_outlined,
            color: isTracking ? AppColors.greenActive : AppColors.redDanger,
            size: 12,
          ),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final String? truckName;
  final bool isOnRoute;

  const _HeroCard({this.truckName, required this.isOnRoute});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.heroGreen,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.greenActive.withOpacity(0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isOnRoute ? 'TURNO ACTIVO' : 'TURNO PENDIENTE',
            style: AppTextStyles.label.copyWith(color: AppColors.greenActive),
          ),
          const SizedBox(height: 4),
          Text(
            truckName ?? 'Sin camión asignado',
            style: AppTextStyles.heading2,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _HeroStat(
                  value: isOnRoute ? '●' : '○',
                  label: isOnRoute ? 'En ruta' : 'Esperando',
                ),
              ),
              _HeroDivider(),
              Expanded(
                child: _HeroStat(
                  value: TimeOfDay.now().format(context),
                  label: 'Hora actual',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: AppTextStyles.heading3),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.label),
      ],
    );
  }
}

class _HeroDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      width: 1,
      color: AppColors.greenActive.withOpacity(0.2),
    );
  }
}

class _QuickAccessGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      _QuickItem(icon: Icons.alt_route, title: 'Ver ruta', subtitle: 'Colonias', route: AppRoutes.route),
      _QuickItem(icon: Icons.map, title: 'Mapa GPS', subtitle: 'En tiempo real', route: AppRoutes.map),
      _QuickItem(icon: Icons.report_outlined, title: 'Reportar', subtitle: 'Incidencias', route: AppRoutes.report),
      _QuickItem(icon: Icons.notifications_outlined, title: 'Avisos', subtitle: 'Del admin', route: AppRoutes.notifications),
    ];

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.3,
      children: items.map((item) => _QuickAccessCard(item: item)).toList(),
    );
  }
}

class _QuickItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final String route;
  const _QuickItem({required this.icon, required this.title, required this.subtitle, required this.route});
}

class _QuickAccessCard extends StatelessWidget {
  const _QuickAccessCard({required this.item});
  final _QuickItem item;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, item.route),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderSubtle, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(item.icon, color: AppColors.greenActive, size: 28),
            const Spacer(),
            Text(item.title, style: AppTextStyles.heading3),
            const SizedBox(height: 2),
            Text(item.subtitle, style: AppTextStyles.bodyMuted.copyWith(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final int total;
  final int completed;
  final String nextColony;
  const _ProgressCard({
    required this.total,
    required this.completed,
    required this.nextColony,
  });

  @override
  Widget build(BuildContext context) {
    final progress = total > 0 ? completed / total : 0.0;
    final percent = (progress * 100).round();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Progreso de ruta', style: AppTextStyles.heading3),
              Text(
                total > 0 ? '$percent%' : '--',
                style: AppTextStyles.heading3.copyWith(color: AppColors.greenActive),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: AppColors.borderSubtle,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.greenActive),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, color: AppColors.amberAlert, size: 16),
              const SizedBox(width: 4),
              Text(
                total > 0 ? 'Siguiente: $nextColony' : 'Sin ruta asignada aún',
                style: AppTextStyles.bodyMuted,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FuelCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.amberAlert.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.amberAlert.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.amberAlert.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.local_gas_station, color: AppColors.amberAlert, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Consumo estimado', style: AppTextStyles.label.copyWith(color: AppColors.amberAlert)),
                const SizedBox(height: 2),
                Text('~68 L · rango normal 60–90 L/turno',
                    style: AppTextStyles.body.copyWith(fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}