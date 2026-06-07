import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/widgets/shared_bottom_nav.dart';
import 'package:recolecta_celaya/services/voice_guide_service.dart';
import 'package:recolecta_celaya/services/proximity_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      VoiceGuideService.instance.speak("Bienvenido a tu panel principal. Tu ruta de recolección está en curso y el camión llegará pronto.");
    });
    
    // Iniciar monitoreo de proximidad del camión
    ProximityService().startMonitoring();
  }

  @override
  void dispose() {
    ProximityService().stopMonitoring();
    super.dispose();
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    // ── ETA / Ventana de llegada ───────────────────────
                    _buildEtaCard(),
                    const SizedBox(height: 20),

                    // ── Semáforo / Mensajería preventiva ─────────────
                    _buildActionBanner(),
                    const SizedBox(height: 20),

                    // ── Barra de progreso de ruta ─────────────────────
                    _buildRouteProgress(),
                    const SizedBox(height: 25),

                    // ── Grid de acciones ──────────────────────────────
                    _buildActionGrid(context),
                    const SizedBox(height: 20),

                    // ── Banner de seguridad (permanente) ─────────────
                    _buildSafetyBanner(),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ),
            _buildCitySkyline(),
          ],
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 0),
    );
  }

  // ── Encabezado ──────────────────────────────────────────────────────────

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(Icons.menu, size: 30),
              Image.asset(
                'assets/ruta_limpia_transparente.png',
                height: 50,
                errorBuilder: (_, __, ___) => Text(
                  'Ruta Limpia',
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlue,
                      fontSize: 16),
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.pushNamed(context, '/alerts'),
                child: const Icon(Icons.person_2_outlined, size: 30),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Selector de domicilio
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.lightGrayBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.home, color: AppColors.aquaGreen, size: 18),
                const SizedBox(width: 8),
                Text('Mi Casa',
                    style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.darkBlue)),
                const SizedBox(width: 6),
                const Icon(Icons.keyboard_arrow_down,
                    size: 18, color: Colors.grey),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: RichText(
              text: TextSpan(
                style: GoogleFonts.poppins(
                    fontSize: 24, color: Colors.black),
                children: [
                  const TextSpan(text: '¡Hola, '),
                  TextSpan(
                    text: 'vecino!',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.aquaGreen),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 2),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('Juntos por una ciudad más limpia.',
                style: TextStyle(fontSize: 13, color: Colors.grey)),
          ),
        ],
      ),
    );
  }

  // ── ETA Card ────────────────────────────────────────────────────────────

  Widget _buildEtaCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryBlue, Color(0xFF0051B5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
              color: AppColors.primaryBlue.withValues(alpha: 0.4),
              blurRadius: 14,
              offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.local_shipping,
                    color: Colors.white, size: 22),
              ),
              const SizedBox(width: 10),
              Text('Ventana de Llegada',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 13)),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('En curso',
                    style: TextStyle(color: Colors.white, fontSize: 11)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'El camión llegará entre las',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8), fontSize: 13),
          ),
          Text(
            '7:20 y 7:35 a.m.',
            style: GoogleFonts.poppins(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.access_time, color: Colors.white, size: 15),
                SizedBox(width: 6),
                Text('Aproximadamente en ~15 minutos',
                    style:
                        TextStyle(color: Colors.white, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Semáforo / Mensajería preventiva ────────────────────────────────────

  Widget _buildActionBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.orangeNotice.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: const BoxDecoration(
              color: AppColors.orangeNotice,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('¡El camión está cerca!',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.orangeNotice,
                        fontSize: 14)),
                const SizedBox(height: 3),
                const Text(
                    'Es momento de sacar tus residuos al punto autorizado.',
                    style: TextStyle(fontSize: 12, color: Colors.black87)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Progreso de ruta ────────────────────────────────────────────────────

  Widget _buildRouteProgress() {
    const stages = [
      'En espera',
      'Iniciada',
      'Próximo',
      'Recolectado',
      'Finalizado',
    ];
    const currentStage = 2; // "Próximo"

    return Container(
      padding: const EdgeInsets.all(18),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Estado de la Ruta',
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: AppColors.darkBlue)),
          const SizedBox(height: 14),
          Row(
            children: List.generate(stages.length * 2 - 1, (i) {
              if (i.isOdd) {
                final stageIdx = i ~/ 2;
                return Expanded(
                  child: Container(
                    height: 3,
                    color: stageIdx < currentStage
                        ? AppColors.aquaGreen
                        : Colors.grey.shade200,
                  ),
                );
              }
              final idx = i ~/ 2;
              final done = idx < currentStage;
              final active = idx == currentStage;
              return Column(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: done
                          ? AppColors.aquaGreen
                          : active
                              ? AppColors.primaryBlue
                              : Colors.grey.shade200,
                      shape: BoxShape.circle,
                      border: active
                          ? Border.all(
                              color: AppColors.primaryBlue, width: 2)
                          : null,
                    ),
                    child: Icon(
                      done
                          ? Icons.check
                          : active
                              ? Icons.local_shipping
                              : Icons.circle,
                      color: done || active
                          ? Colors.white
                          : Colors.grey.shade400,
                      size: done ? 16 : (active ? 14 : 8),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    stages[idx],
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: active
                          ? FontWeight.bold
                          : FontWeight.normal,
                      color: active
                          ? AppColors.primaryBlue
                          : done
                              ? AppColors.aquaGreen
                              : Colors.grey,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }

  // ── Grid de acciones ─────────────────────────────────────────────────────

  Widget _buildActionGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 15,
      mainAxisSpacing: 15,
      childAspectRatio: 1.1,
      children: [
        _buildMenuTile(
          context,
          title: 'Ver camión',
          icon: Icons.local_shipping,
          color: AppColors.primaryBlue,
          sub: 'Sigue la ruta en tiempo real',
          route: '/mapa-camion',
        ),
        _buildMenuTile(
          context,
          title: 'Escuchar ruta',
          icon: Icons.volume_up,
          color: AppColors.aquaGreen,
          sub: 'Información por audio',
          route: null,
          onTapOverride: () {
            VoiceGuideService.instance.speak("El camión de basura llegará entre las 7:20 y 7:35 de la mañana. Aproximadamente en 15 minutos.", force: true);
          },
        ),
        _buildMenuTile(
          context,
          title: 'Guía de residuos',
          icon: Icons.delete_sweep,
          color: AppColors.aquaGreen,
          sub: 'Aprende a separar',
          route: '/waste-guide',
        ),
        _buildMenuTile(
          context,
          title: 'Avisos',
          icon: Icons.campaign,
          color: AppColors.orangeNotice,
          sub: 'Alertas y cambios',
          route: '/avisos',
        ),
      ],
    );
  }

  Widget _buildMenuTile(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required String sub,
    required String? route,
    VoidCallback? onTapOverride,
  }) {
    return GestureDetector(
      onTap: onTapOverride ?? (route != null
          ? () => Navigator.pushNamed(context, route)
          : () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Próximamente disponible'),
                  behavior: SnackBarBehavior.floating,
                ),
              )),
      child: Container(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 4)),
          ],
        ),
        padding: const EdgeInsets.all(15),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 35),
            const Spacer(),
            Text(title,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16)),
            Text(sub,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8), fontSize: 10)),
          ],
        ),
      ),
    );
  }

  // ── Banner de seguridad permanente ──────────────────────────────────────

  Widget _buildSafetyBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFEBEE),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.security, color: Colors.red, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Por tu seguridad, no intentes alcanzar o perseguir la unidad en movimiento. El camión solo se detiene en los puntos autorizados.',
              style: TextStyle(
                  fontSize: 11, color: Colors.red.shade700, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  // ── Silueta ciudad ───────────────────────────────────────────────────────

  Widget _buildCitySkyline() {
    return Opacity(
      opacity: 0.15,
      child: SvgPicture.asset(
        'assets/celaya_skyline.svg',
        width: double.infinity,
        fit: BoxFit.fitWidth,
        placeholderBuilder: (_) => const SizedBox(height: 60),
      ),
    );
  }
}