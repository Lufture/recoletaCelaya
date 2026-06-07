// lib/features/report/presentation/screens/report_screen.dart
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';
import 'package:recolecta_chofer/core/widgets/app_bottom_nav.dart';
import 'package:recolecta_chofer/core/widgets/status_pill.dart';
import 'package:recolecta_chofer/features/report/presentation/widgets/incident_type_card.dart';
import 'package:recolecta_chofer/features/report/data/report_service.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _reportService = ReportService();
  bool _isLoading = false;
  bool _isSosLoading = false;
  int _selectedIncident = -1;
  final _descController = TextEditingController();
  final _coloniaController = TextEditingController(text: 'Los Álamos (actual)');
  Position? _currentPosition;
  bool _isFetchingLocation = true;

  final List<Map<String, dynamic>> _incidentTypes = [
    {'icon': Icons.car_repair, 'label': 'Falla\nmecánica', 'value': 'falla_mecanica'},
    {'icon': Icons.car_crash_outlined, 'label': 'Accidente', 'value': 'accidente'},
    {'icon': Icons.block, 'label': 'Bloqueo/\nTráfico', 'value': 'bloqueo'},
    {'icon': Icons.warning_amber_outlined, 'label': 'Otro\nincidente', 'value': 'otro'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchLocation();
  }

  Future<void> _fetchLocation() async {
    try {
      final hasPermission = await Geolocator.checkPermission();
      if (hasPermission == LocationPermission.always || hasPermission == LocationPermission.whileInUse) {
        final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        if (mounted) {
          setState(() {
            _currentPosition = position;
            _isFetchingLocation = false;
          });
        }
      } else {
        if (mounted) setState(() => _isFetchingLocation = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isFetchingLocation = false);
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    _coloniaController.dispose();
    super.dispose();
  }

  Future<void> _sendReport() async {
    if (_selectedIncident == -1) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.amber,
          content: Text(
            'Selecciona un tipo de incidencia',
            style: AppTextStyles.body.copyWith(color: AppColors.backgroundPrimary),
          ),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _reportService.submitReport(
        tipo: _incidentTypes[_selectedIncident]['value'],
        titulo: _incidentTypes[_selectedIncident]['label'].toString().replaceAll('\n', ' '),
        descripcion: _descController.text,
        latitud: _currentPosition?.latitude,
        longitud: _currentPosition?.longitude,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.greenButton,
            content: Text(
              'Reporte enviado al administrador',
              style: AppTextStyles.body.copyWith(color: AppColors.textPrimary),
            ),
          ),
        );
        setState(() {
          _selectedIncident = -1;
          _descController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.redDanger,
            content: Text('Error: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _sendSOS() async {
    setState(() => _isSosLoading = true);
    try {
      await _reportService.triggerSOS(
        mensaje: '¡Emergencia desde la pantalla de reportes!',
        latitud: _currentPosition?.latitude,
        longitud: _currentPosition?.longitude,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.redDanger,
            content: Text(
              'ALERTA SOS ENVIADA',
              style: AppTextStyles.body.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.redDanger,
            content: Text('Error: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSosLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Reportar incidencia', style: AppTextStyles.heading3),
        automaticallyImplyLeading: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: StatusPill(label: 'RUTA-02', color: AppColors.blueInfo),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Botón SOS grande
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton.icon(
                onPressed: _isSosLoading ? null : _sendSOS,
                icon: _isSosLoading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.warning_rounded, color: Colors.white, size: 28),
                label: Text(
                  'BOTÓN SOS',
                  style: AppTextStyles.heading2.copyWith(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.redDanger,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 24),

            Text('Tipo de incidencia', style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 12),

            // Grid 2x2 de tipos de incidencia
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: List.generate(_incidentTypes.length, (index) {
                return IncidentTypeCard(
                  icon: _incidentTypes[index]['icon'] as IconData,
                  label: _incidentTypes[index]['label'] as String,
                  isSelected: _selectedIncident == index,
                  onTap: () => setState(() => _selectedIncident = index),
                );
              }),
            ),

            const SizedBox(height: 20),

            // Descripción
            Text('Descripción', style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descController,
              minLines: 3,
              maxLines: 5,
              style: AppTextStyles.body.copyWith(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Describe brevemente lo ocurrido...',
                hintStyle: AppTextStyles.body.copyWith(color: AppColors.textMuted),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.borderSubtle),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.greenActive, width: 2),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Colonia afectada
            Text('Colonia afectada', style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _coloniaController,
              style: AppTextStyles.body.copyWith(color: AppColors.textPrimary),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.greenActive),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.borderSubtle),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.greenActive, width: 2),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Card coordenadas adjuntas
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.blueInfo.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.gps_fixed, color: AppColors.blueInfo, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Coordenadas adjuntas automáticamente',
                          style: AppTextStyles.label.copyWith(color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _isFetchingLocation 
                              ? 'Obteniendo GPS...' 
                              : (_currentPosition != null 
                                  ? '${_currentPosition!.latitude.toStringAsFixed(4)}° N, ${_currentPosition!.longitude.toStringAsFixed(4)}° O' 
                                  : 'GPS no disponible'),
                          style: AppTextStyles.badge.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _currentPosition != null ? Icons.check_circle : Icons.warning, 
                    color: _currentPosition != null ? AppColors.greenActive : AppColors.amber, 
                    size: 18
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Botón enviar
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isLoading ? null : _sendReport,
                icon: _isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: AppColors.backgroundPrimary, strokeWidth: 2))
                  : const Icon(Icons.send_rounded, color: AppColors.backgroundPrimary),
                label: Text(
                  _isLoading ? 'Enviando...' : 'Enviar reporte al administrador',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.backgroundPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.amber,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 3),
    );
  }
}