// lib/features/profile/presentation/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_routes.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';
import 'package:recolecta_chofer/core/widgets/app_bottom_nav.dart';
import 'package:recolecta_chofer/core/widgets/section_label.dart';
import 'package:recolecta_chofer/core/widgets/status_pill.dart';
import 'package:recolecta_chofer/features/auth/data/auth_service.dart';
import 'package:recolecta_chofer/features/profile/presentation/widgets/profile_menu_item.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _authService = AuthService();
  bool _gpsInterno = true;
  Map<String, dynamic>? _userProfile;
  bool _isLoadingProfile = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profile = await _authService.getCurrentUserProfile();
    if (mounted) {
      setState(() {
        _userProfile = profile;
        _isLoadingProfile = false;
      });
    }
  }

  void _cerrarSesion() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Cerrar sesión', style: AppTextStyles.heading3),
        content: Text(
          '¿Estás seguro que deseas cerrar la sesión? El turno quedará registrado.',
          style: AppTextStyles.body.copyWith(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: AppTextStyles.label.copyWith(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context); // Cerrar el dialog
              await _authService.signOut();
              if (mounted) Navigator.pushReplacementNamed(context, AppRoutes.login);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.redButton),
            child: Text('Cerrar sesión', style: AppTextStyles.label.copyWith(color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Mi perfil', style: AppTextStyles.heading3),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Avatar
            CircleAvatar(
              radius: 44,
              backgroundColor: AppColors.greenButton,
              child: const Icon(Icons.person, size: 48, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 14),

            // Nombre e ID
            if (_isLoadingProfile)
              const CircularProgressIndicator(color: AppColors.greenActive)
            else ...[
              Text(
                '${_userProfile?['nombre'] ?? 'Usuario'} ${_userProfile?['apellidos'] ?? ''}'.trim(),
                style: AppTextStyles.heading2,
              ),
              const SizedBox(height: 4),
              Text(
                _userProfile?['correo'] ?? 'Chofer',
                style: AppTextStyles.body.copyWith(color: AppColors.textSecondary),
              ),
            ],
            const SizedBox(height: 10),

            // Pill turno activo
            StatusPill(label: 'Turno activo', color: AppColors.greenActive),
            const SizedBox(height: 20),

            // Card verde con info del turno
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.greenDarkBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.greenActive.withOpacity(0.3)),
              ),
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 2.8,
                crossAxisSpacing: 8,
                mainAxisSpacing: 12,
                children: [
                  _infoCell(Icons.directions_bus_outlined, 'Unidad', 'TA-102'),
                  _infoCell(Icons.route_outlined, 'Ruta', 'RUTA-02'),
                  _infoCell(Icons.access_time, 'Inicio', '06:05'),
                  _infoCell(Icons.location_city, 'Colonias', '7'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Sección configuración
            Align(
              alignment: Alignment.centerLeft,
              child: const SectionLabel(text: 'Configuración'),
            ),
            const SizedBox(height: 12),

            // Toggle GPS
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                      color: AppColors.greenActive.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.gps_fixed, color: AppColors.greenActive, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GPS módulo interno',
                          style: AppTextStyles.label.copyWith(color: AppColors.textPrimary),
                        ),
                        Text(
                          _gpsInterno ? 'Usando módulo del dispositivo' : 'Usando GPS externo',
                          style: AppTextStyles.badge.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _gpsInterno,
                    onChanged: (v) => setState(() => _gpsInterno = v),
                    activeColor: AppColors.greenActive,
                    activeTrackColor: AppColors.greenButton.withOpacity(0.4),
                    inactiveThumbColor: AppColors.textMuted,
                    inactiveTrackColor: AppColors.borderSubtle,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            ProfileMenuItem(
              icon: Icons.notifications_outlined,
              iconColor: AppColors.blueInfo,
              title: 'Notificaciones',
              subtitle: 'Avisos de turno y rutas',
              onTap: () {},
            ),
            ProfileMenuItem(
              icon: Icons.lock_outline,
              iconColor: AppColors.amber,
              title: 'Cambiar NIP',
              subtitle: 'Actualiza tu clave de acceso',
              onTap: () {},
            ),
            ProfileMenuItem(
              icon: Icons.headset_mic_outlined,
              iconColor: AppColors.greenActive,
              title: 'Soporte',
              subtitle: 'Contactar al administrador',
              onTap: () {},
            ),

            const SizedBox(height: 24),

            // Botón cerrar sesión
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _cerrarSesion,
                icon: const Icon(Icons.logout_rounded, color: AppColors.textPrimary),
                label: Text(
                  'Cerrar sesión',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.redButton,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: AppBottomNav(currentIndex: 4),
    );
  }

  Widget _infoCell(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppColors.greenActive, size: 18),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: AppTextStyles.badge.copyWith(color: AppColors.textMuted)),
            Text(value, style: AppTextStyles.label.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
          ],
        ),
      ],
    );
  }
}