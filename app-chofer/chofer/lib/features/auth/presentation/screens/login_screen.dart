// lib/features/auth/presentation/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_routes.dart';
import 'package:recolecta_chofer/features/auth/data/auth_service.dart';

// ── Paleta oficial Ruta Limpia Celaya ─────────────────────────────────────────
class _Colors {
  static const background   = Color(0xFFFFFFFF);
  static const darkBlue     = Color(0xFF0D3B66);
  static const crimson      = Color(0xFF9B2335);
  static const gold         = Color(0xFFC9A84C);
  static const inputBorder  = Color(0xFFD0D5DD);
  static const textMuted    = Color(0xFF555555);
  static const white        = Color(0xFFFFFFFF);
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey         = GlobalKey<FormState>();
  final _emailCtrl       = TextEditingController();
  final _passwordCtrl    = TextEditingController();
  bool _obscurePassword  = true;
  bool _isLoading        = false;
  final _authService     = AuthService();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // ── Campo de texto ────────────────────────────────────────────────────────
  InputDecoration _fieldDecoration(String label, IconData icon, {Widget? suffix}) {
    const radius = BorderRadius.all(Radius.circular(12));
    return InputDecoration(
      labelText:   label,
      labelStyle:  const TextStyle(color: _Colors.darkBlue, fontSize: 15),
      prefixIcon:  Icon(icon, color: _Colors.darkBlue, size: 20),
      suffixIcon:  suffix,
      filled:      true,
      fillColor:   _Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      enabledBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: _Colors.inputBorder, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: _Colors.crimson, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: _Colors.crimson, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: _Colors.crimson, width: 1.5),
      ),
    );
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  Future<void> _handleLogin() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isLoading = true);
    try {
      await _authService.signInWithEmailPassword(
        email:    _emailCtrl.text.trim(),
        password: _passwordCtrl.text.trim(),
      );
      if (mounted) Navigator.pushReplacementNamed(context, AppRoutes.dashboard);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Error al iniciar sesión: $e'),
          backgroundColor: _Colors.crimson,
        ));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _Colors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [

                const SizedBox(height: 32),

                // ── Logo Ruta Limpia Celaya ──────────────────────────────
                Image.asset(
                  'assets/logo_ruta_limpia.png',
                  width: MediaQuery.of(context).size.width * 0.72,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => _FallbackLogo(),
                ),

                const SizedBox(height: 20),

                // ── Bienvenida ───────────────────────────────────────────
                const Text(
                  '¡Bienvenido de vuelta!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: _Colors.darkBlue,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Acceso exclusivo para operadores\ndel servicio de limpia',
                  style: TextStyle(fontSize: 14, color: _Colors.textMuted, height: 1.5),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 32),

                // ── Correo ───────────────────────────────────────────────
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(fontSize: 15),
                  decoration: _fieldDecoration('Correo electrónico', Icons.email_outlined),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ingresa tu correo';
                    if (!v.contains('@')) return 'Ingresa un correo válido';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // ── Contraseña ───────────────────────────────────────────
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  style: const TextStyle(fontSize: 15),
                  decoration: _fieldDecoration(
                    'Contraseña',
                    Icons.lock_outline,
                    suffix: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: _Colors.darkBlue,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ingresa tu contraseña';
                    if (v.length < 6) return 'Mínimo 6 caracteres';
                    return null;
                  },
                ),

                const SizedBox(height: 28),

                // ── Botón principal ──────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _Colors.darkBlue,
                      foregroundColor: _Colors.white,
                      disabledBackgroundColor: _Colors.darkBlue.withOpacity(0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 22, height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: _Colors.white,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.login, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Entrar al turno',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 36),

                // ── Divider ──────────────────────────────────────────────
                const Divider(color: Color(0xFFE5E7EB), thickness: 0.5),

                const SizedBox(height: 20),

                // ── Logo Gobierno Celaya ─────────────────────────────────
                Image.asset(
                  'assets/logo_celaya.png',
                  height: 72,
                  width: MediaQuery.of(context).size.width * 0.45,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),

                const SizedBox(height: 12),

                // ── Silueta / banner ─────────────────────────────────────
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/silueta_celaya.png',
                    height: 60,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),

                const SizedBox(height: 12),

                Text(
                  'Municipio de Celaya · Servicio de Limpia',
                  style: TextStyle(
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                    color: _Colors.darkBlue.withOpacity(0.55),
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Widget de respaldo si no carga el asset del logo ─────────────────────────
class _FallbackLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(
            color: const Color(0xFF0D3B66).withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.recycling, color: Color(0xFF9B2335), size: 40),
        ),
        const SizedBox(height: 8),
        const Text(
          'Ruta Limpia',
          style: TextStyle(
            fontSize: 20, fontWeight: FontWeight.w700,
            color: Color(0xFF0D3B66),
          ),
        ),
        const Text(
          'Celaya',
          style: TextStyle(
            fontSize: 32, fontWeight: FontWeight.w700,
            color: Color(0xFF9B2335),
          ),
        ),
        const Text(
          'Juntos por una ciudad más limpia',
          style: TextStyle(
            fontSize: 13, fontStyle: FontStyle.italic,
            color: Color(0xFFC9A84C),
          ),
        ),
      ],
    );
  }
}