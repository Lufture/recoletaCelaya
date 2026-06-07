import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/widgets/shared_bottom_nav.dart';
import 'package:recolecta_celaya/services/voice_guide_service.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({Key? key}) : super(key: key);

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  bool _notifyRouteStart = true;
  bool _notify15Min = true;
  bool _notifyDelays = false;
  bool _notifyWeather = false;
  bool _silentHours = false;
  
  late bool _voiceGuideEnabled;

  @override
  void initState() {
    super.initState();
    _voiceGuideEnabled = VoiceGuideService.instance.isEnabled;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGrayBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // IconButton(
                    //     splashColor: Colors.transparent,
                    //     highlightColor: Colors.transparent,
                    //     padding: const EdgeInsets.all(0),
                    //     onPressed: () => Navigator.pop(context),
                    //     icon: const Icon(Icons.arrow_back, color: AppColors.primaryBlue)),
                    _sectionTitle('Alertas de Ruta'),
                    const SizedBox(height: 12),
                    _buildToggleCard(
                      icon: Icons.play_circle_outline,
                      color: AppColors.aquaGreen,
                      title: 'Ruta iniciada',
                      subtitle: 'Avisa cuando la unidad sale de la base.',
                      value: _notifyRouteStart,
                      onChanged: (v) =>
                          setState(() => _notifyRouteStart = v),
                    ),
                    _buildToggleCard(
                      icon: Icons.timer_outlined,
                      color: AppColors.primaryBlue,
                      title: '15 minutos antes',
                      subtitle:
                          'Notificación preventiva para que saques tu basura a tiempo.',
                      value: _notify15Min,
                      onChanged: (v) => setState(() => _notify15Min = v),
                    ),
                    _buildToggleCard(
                      icon: Icons.warning_amber_outlined,
                      color: AppColors.orangeNotice,
                      title: 'Retrasos y fallas',
                      subtitle:
                          'Infórmate si hay tráfico, fallas mecánicas o cambios de ruta.',
                      value: _notifyDelays,
                      onChanged: (v) => setState(() => _notifyDelays = v),
                    ),
                    const SizedBox(height: 20),
                    _sectionTitle('Preferencias'),
                    const SizedBox(height: 12),
                    _buildToggleCard(
                      icon: Icons.wb_cloudy_outlined,
                      color: const Color(0xFF5C6BC0),
                      title: 'Alertas climáticas',
                      subtitle:
                          'Notifica si el servicio se ve afectado por mal clima.',
                      value: _notifyWeather,
                      onChanged: (v) =>
                          setState(() => _notifyWeather = v),
                    ),
                    _buildToggleCard(
                      icon: Icons.record_voice_over_outlined,
                      color: const Color(0xFF9C27B0), // Purple for accessibility
                      title: 'Guía de voz',
                      subtitle:
                          'Narra el contenido de la aplicación para facilitar su uso.',
                      value: _voiceGuideEnabled,
                      onChanged: (v) async {
                        setState(() => _voiceGuideEnabled = v);
                        await VoiceGuideService.instance.setEnabled(v);
                      },
                    ),
                    _buildToggleCard(
                      icon: Icons.nightlight_round,
                      color: const Color(0xFF37474F),
                      title: 'Silencio nocturno',
                      subtitle:
                          'No enviar notificaciones entre las 10 p.m. y 7 a.m.',
                      value: _silentHours,
                      onChanged: (v) =>
                          setState(() => _silentHours = v),
                    ),
                    const SizedBox(height: 28),
                    _buildSaveButton(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 0),
    );
  }

  Widget _buildHeader() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Row(
        children: [
          IconButton(
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            padding: const EdgeInsets.all(0),
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: AppColors.primaryBlue),
          ),
          
          const SizedBox(width: 12),
          Text(
            'Preferencias de Alertas',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlue,
            ),
          ),
          Spacer(),
          const Icon(
            Icons.notifications_active_outlined,
            color: AppColors.primaryBlue,
            size: 25,
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: GoogleFonts.poppins(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Colors.grey[500],
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _buildToggleCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(
                        fontSize: 12, color: Colors.grey[500])),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.aquaGreen,
          ),
        ],
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryBlue,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 3,
        ),
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Preferencias guardadas ✓'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: AppColors.aquaGreen,
            ),
          );
        },
        child: Text(
          'Guardar preferencias',
          style: GoogleFonts.poppins(
              fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
