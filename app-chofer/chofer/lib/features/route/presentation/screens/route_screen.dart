// lib/features/route/presentation/screens/route_screen.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';
import 'package:recolecta_chofer/core/widgets/app_bottom_nav.dart';
import 'package:recolecta_chofer/core/widgets/status_pill.dart';
import 'package:recolecta_chofer/features/route/presentation/widgets/colony_item.dart';
import 'package:recolecta_chofer/features/route/data/shift_service.dart';
import 'package:recolecta_chofer/core/services/supabase_service.dart';

class RouteScreen extends StatefulWidget {
  const RouteScreen({super.key});

  @override
  State<RouteScreen> createState() => _RouteScreenState();
}

class _RouteScreenState extends State<RouteScreen> {
  final _shiftService = ShiftService();
  bool _isLoading = true;
  int _completedCount = 0;
  List<_ColonyData> _colonies = [];
  Map<String, dynamic>? _activeShift;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final shift = await _shiftService.getActiveShift();
      if (shift != null) {
        _activeShift = shift; // <--- Set activeShift immediately!

        if (shift['ruta_id'] != null) {
          final coloniesData = await _shiftService.getRouteColonies(shift['ruta_id']);
          
          final parsed = coloniesData.map((e) {
            final c = e['colonias'];
            final name = c != null ? c['nombre'] : 'Colonia desconocida';
            final time = e['horario_estimado'] ?? e['hora_inicio_estimada'] ?? 'Horario abierto';
            return _ColonyData(
              id: e['id'] ?? '',
              name: name,
              time: time,
              status: ColonyStatus.pending,
            );
          }).toList();
          
          // Simular progreso: la primera pendiente se vuelve activa
          if (parsed.isNotEmpty) {
            parsed[0] = _ColonyData(
              id: parsed[0].id,
              name: parsed[0].name,
              time: parsed[0].time,
              status: ColonyStatus.active,
            );
          }

          if (mounted) {
            setState(() {
              _colonies = parsed;
              _isLoading = false;
            });
          }
        } else {
          // No hay ruta_id
          if (mounted) setState(() => _isLoading = false);
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _markCurrentCompleted() async {
    final activeIndex = _colonies.indexWhere((c) => c.status == ColonyStatus.active);
    if (activeIndex == -1) return;

    setState(() {
      _colonies[activeIndex] = _ColonyData(
        id: _colonies[activeIndex].id,
        name: _colonies[activeIndex].name,
        time: _colonies[activeIndex].time,
        status: ColonyStatus.done,
      );
      _completedCount++;

      final nextPending = _colonies.indexWhere((c) => c.status == ColonyStatus.pending);
      if (nextPending != -1) {
        _colonies[nextPending] = _ColonyData(
          id: _colonies[nextPending].id,
          name: _colonies[nextPending].name,
          time: _colonies[nextPending].time,
          status: ColonyStatus.active,
        );
      }
    });

    if (_activeShift != null) {
       try {
         await SupabaseService.client
            .from('recorridos')
            .update({'ultimo_position_id': activeIndex + 1})
            .eq('id', _activeShift!['id']);
       } catch (e) {
         print('Error guardando progreso: $e');
       }
    }
  }

  double get _progress => _colonies.isEmpty ? 0 : _completedCount / _colonies.length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _activeShift?['rutas']?['nombre'] != null
              ? 'Mi ruta · ${_activeShift!['rutas']['nombre']}'
              : 'Mi ruta',
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: StatusPill(
              label: _colonies.isNotEmpty ? 'En curso' : 'Sin ruta asignada',
              backgroundColor: (_colonies.isNotEmpty ? AppColors.amberAlert : AppColors.textMuted).withValues(alpha: 0.2),
              textColor: _colonies.isNotEmpty ? AppColors.amberAlert : AppColors.textMuted,
              dotColor: _colonies.isNotEmpty ? AppColors.amberAlert : AppColors.textMuted,
              color: AppColors.surface,
            ),
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.greenActive))
        : _colonies.isEmpty 
          ? Center(
              child: Text(
                _activeShift == null ? 'No hay turno activo' : 'No hay colonias asignadas a esta ruta',
                style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)
              )
            )
          : Padding(
              padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Progreso
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$_completedCount de ${_colonies.length} colonias completadas',
                          style: AppTextStyles.body),
                      Text('${(_progress * 100).round()}%',
                          style: AppTextStyles.heading3.copyWith(color: AppColors.greenActive)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: _progress,
                      minHeight: 8,
                      backgroundColor: AppColors.borderSubtle,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.greenActive),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Lista de colonias
            Expanded(
              child: ListView.builder(
                itemCount: _colonies.length,
                itemBuilder: (context, index) {
                  final colony = _colonies[index];
                  return ColonyItemTile(
                    name: colony.name,
                    time: colony.time,
                    status: colony.status,
                  );
                },
              ),
            ),

            // Botón marcar completada
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _colonies.any((c) => c.status == ColonyStatus.active)
                  ? _markCurrentCompleted
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.greenButton,
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_outline, size: 20),
                  const SizedBox(width: 8),
                  Text('Marcar colonia actual como completada',
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
    );
  }
}

class _ColonyData {
  final String id;
  final String name;
  final String time;
  final ColonyStatus status;
  const _ColonyData({required this.id, required this.name, required this.time, required this.status});
}