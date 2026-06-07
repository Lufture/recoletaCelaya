import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/widgets/shared_bottom_nav.dart';

class PerfilScreen extends StatefulWidget {
  const PerfilScreen({Key? key}) : super(key: key);

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  final user = Supabase.instance.client.auth.currentUser;
  bool _isLoading = false;
  Map<String, dynamic>? _domicilio;

  @override
  void initState() {
    super.initState();
    _fetchDomicilio();
  }

  Future<void> _fetchDomicilio() async {
    if (user != null) {
      try {
        final response = await Supabase.instance.client
            .from('domicilios_usuario')
            .select()
            .eq('usuario_id', user!.id)
            .maybeSingle();
        if (mounted) {
          setState(() {
            _domicilio = response;
          });
        }
      } catch (e) {
        debugPrint("Error fetching domicilio: $e");
      }
    }
  }

  Future<void> _signOut() async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.auth.signOut();
      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cerrar sesión: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGrayBg,
      appBar: AppBar(
        title: Text(
          'Mi Perfil',
          style: GoogleFonts.poppins(
            color: AppColors.primaryBlue,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        automaticallyImplyLeading: false, // Ocultar botón atrás porque es tab principal
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 30),
              const CircleAvatar(
                radius: 50,
                backgroundColor: AppColors.primaryBlue,
                child: Icon(Icons.person, size: 50, color: Colors.white),
              ),
              const SizedBox(height: 20),
              Text(
                user?.email ?? 'Usuario',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.darkBlue,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'ID: ${user?.id ?? 'N/A'}',
                style: TextStyle(fontSize: 12, color: Colors.grey[500]),
              ),
              const SizedBox(height: 30),
              
              // Sección de Domicilio
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Mi Domicilio', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.darkBlue)),
                        TextButton.icon(
                          onPressed: () async {
                            final changed = await Navigator.pushNamed(context, '/edit-location');
                            if (changed == true) {
                              _fetchDomicilio(); // Refrescar si se guardó algo
                            }
                          },
                          icon: const Icon(Icons.edit_location_alt, size: 18, color: AppColors.aquaGreen),
                          label: Text('Editar', style: GoogleFonts.poppins(color: AppColors.aquaGreen, fontWeight: FontWeight.w600)),
                        )
                      ],
                    ),
                    const Divider(),
                    const SizedBox(height: 8),
                    if (_domicilio != null) ...[
                      Row(
                        children: [
                          Icon(Icons.location_on, color: AppColors.primaryBlue, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _domicilio!['alias'] ?? 'Ubicación Registrada',
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                                Text(
                                  _domicilio!['calle'] ?? 'Sin dirección',
                                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                                ),
                              ],
                            ),
                          )
                        ],
                      )
                    ] else ...[
                      Row(
                        children: [
                          const Icon(Icons.location_off, color: Colors.orange, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'No tienes un domicilio registrado.',
                              style: TextStyle(color: Colors.grey[600], fontSize: 13),
                            ),
                          )
                        ],
                      )
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red[50],
                    foregroundColor: Colors.red,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: BorderSide(color: Colors.red.shade200),
                    ),
                  ),
                  icon: _isLoading 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.red, strokeWidth: 2))
                      : const Icon(Icons.logout),
                  label: Text(
                    _isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión',
                    style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  onPressed: _isLoading ? null : _signOut,
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 3), // Perfil es el index 3
    );
  }
}
