import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/widgets/shared_bottom_nav.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({Key? key}) : super(key: key);

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedIncident;
  final _commentController = TextEditingController();
  bool _isSubmittingReport = false;

  // Estado para la lista de reportes del usuario
  List<dynamic> _userReports = [];
  bool _isLoadingReports = true;

  final List<String> _incidents = [
    'El camión no pasó hoy',
    'Tiraron basura en la calle',
    'Mal servicio del operador',
    'El camión pasó fuera de horario',
    'Problemas con la unidad (ruidos, derrames)',
    'Otro',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchUserReports();
  }

  Future<void> _fetchUserReports() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      if (mounted) setState(() => _isLoadingReports = false);
      return;
    }
    try {
      final response = await Supabase.instance.client
          .from('reportes_ciudadanos')
          .select()
          .eq('anonimo_id', user.id)
          .order('creado_en', ascending: false);
      if (mounted) {
        setState(() {
          _userReports = response;
          _isLoadingReports = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingReports = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al cargar reportes: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGrayBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildReportTab(),
                  _buildMyReportsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 2),
    );
  }

  Widget _buildHeader() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Row(
        children: [
          const Icon(Icons.feedback_outlined,
              color: AppColors.primaryBlue, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Reportes',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlue,
                  ),
                ),
                Text(
                  'Tu opinión mejora el servicio de Celaya',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: AppColors.aquaGreen,
        unselectedLabelColor: Colors.grey,
        indicatorColor: AppColors.aquaGreen,
        indicatorWeight: 3,
        labelStyle:
            GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
        tabs: const [
          Tab(text: 'Reportar incidencia'),
          Tab(text: 'Mis reportes'),
        ],
      ),
    );
  }

  // ── TAB 1: Reporte ──────────────────────────────────────────────────────

  Widget _buildReportTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(
            'Tipo de incidencia',
            style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.darkBlue),
          ),
          const SizedBox(height: 10),
          _buildIncidentDropdown(),
          const SizedBox(height: 20),
          Text(
            'Comentarios adicionales',
            style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.darkBlue),
          ),
          const SizedBox(height: 10),
          _buildCommentField(),
          const SizedBox(height: 20),
          Text(
            'Adjuntar evidencia (opcional)',
            style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.darkBlue),
          ),
          const SizedBox(height: 10),
          _buildPhotoButton(),
          const SizedBox(height: 28),
          _buildSubmitButton(),
        ],
      ),
    );
  }

  Widget _buildIncidentDropdown() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedIncident,
        isExpanded: true,
        decoration: const InputDecoration(
          border: InputBorder.none,
          contentPadding:
              EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          prefixIcon:
              Icon(Icons.list_alt, color: AppColors.aquaGreen),
        ),
        hint: Text('Selecciona el tipo de problema',
            style: TextStyle(color: Colors.grey[400], fontSize: 14)),
        items: _incidents
            .map((i) => DropdownMenuItem(
                  value: i,
                  child: Text(
                    i,
                    style: const TextStyle(fontSize: 14),
                    overflow: TextOverflow.ellipsis,
                  ),
                ))
            .toList(),
        onChanged: (v) => setState(() => _selectedIncident = v),
        borderRadius: BorderRadius.circular(14),
        dropdownColor: Colors.white,
      ),
    );
  }

  Widget _buildCommentField() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: TextField(
        controller: _commentController,
        maxLines: 4,
        maxLength: 280,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText:
              'Describe brevemente lo que ocurrió...',
          hintStyle:
              TextStyle(color: Colors.grey[400], fontSize: 13),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildPhotoButton() {
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Funcionalidad de cámara próximamente'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
      child: Container(
        width: double.infinity,
        height: 90,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: AppColors.aquaGreen.withValues(alpha: 0.4),
              width: 1.5,
              style: BorderStyle.solid),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 6,
                offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.add_a_photo_outlined,
                color: AppColors.aquaGreen, size: 28),
            const SizedBox(height: 6),
            Text('Toca para adjuntar una foto',
                style:
                    TextStyle(color: Colors.grey[500], fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.orangeNotice,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
          elevation: 3,
          shadowColor: AppColors.orangeNotice.withValues(alpha: 0.4),
        ),
        icon: _isSubmittingReport 
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.send_outlined),
        label: Text(
          _isSubmittingReport ? 'Enviando...' : 'Enviar reporte',
          style: GoogleFonts.poppins(
              fontSize: 15, fontWeight: FontWeight.w600),
        ),
        onPressed: _isSubmittingReport ? null : () async {
          if (_selectedIncident == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Por favor selecciona el tipo de incidencia'),
                behavior: SnackBarBehavior.floating,
              ),
            );
            return;
          }

          setState(() => _isSubmittingReport = true);

          try {
            // 1. Obtener ubicación
            bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
            if (!serviceEnabled) throw Exception('GPS desactivado.');

            LocationPermission permission = await Geolocator.checkPermission();
            if (permission == LocationPermission.denied) {
              permission = await Geolocator.requestPermission();
              if (permission == LocationPermission.denied) {
                throw Exception('Permisos de ubicación denegados.');
              }
            }
            if (permission == LocationPermission.deniedForever) {
              throw Exception('Permisos denegados permanentemente.');
            }

            Position position = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.high
            );

            // 2. Insertar en Supabase
            final user = Supabase.instance.client.auth.currentUser;
            await Supabase.instance.client.from('reportes_ciudadanos').insert({
              'anonimo_id': user?.id, // Puede ser null si no hay sesión, pero aquí asumimos que hay
              'tipo': _selectedIncident,
              'descripcion': _commentController.text,
              'latitud': position.latitude,
              'longitud': position.longitude,
            });

            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Reporte enviado. ¡Gracias por tu apoyo! ✓'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: AppColors.aquaGreen,
                ),
              );
              setState(() {
                _selectedIncident = null;
                _commentController.clear();
              });
              // Refrescar la lista de reportes
              _fetchUserReports();
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Error al enviar reporte: $e'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Colors.red,
                ),
              );
            }
          } finally {
            if (mounted) setState(() => _isSubmittingReport = false);
          }
        },
      ),
    );
  }

  // ── TAB 2: Mis Reportes ─────────────────────────────────────────────────

  Widget _buildMyReportsTab() {
    if (_isLoadingReports) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue));
    }

    if (_userReports.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('Aún no has enviado reportes',
                style: TextStyle(color: Colors.grey[600], fontSize: 16)),
            const SizedBox(height: 6),
            Text('Cuando envíes uno, aparecerá aquí.',
                style: TextStyle(color: Colors.grey[400], fontSize: 13)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchUserReports,
      color: AppColors.primaryBlue,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _userReports.length,
        itemBuilder: (context, index) {
          final report = _userReports[index];
          return _buildReportCard(report);
        },
      ),
    );
  }

  Widget _buildReportCard(Map<String, dynamic> report) {
    final estado = (report['estado'] ?? 'nuevo').toString();
    final tipo = report['tipo'] ?? 'Sin tipo';
    final descripcion = report['descripcion'] ?? '';
    final creadoEn = _formatDate(report['creado_en']);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Encabezado: tipo + badge de estado
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _statusColor(estado).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_statusIcon(estado), color: _statusColor(estado), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  tipo,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.darkBlue,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(estado).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusLabel(estado),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _statusColor(estado),
                  ),
                ),
              ),
            ],
          ),
          if (descripcion.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              descripcion,
              style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.4),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.access_time, size: 14, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text(
                'Enviado el $creadoEn',
                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(String? isoString) {
    if (isoString == null) return 'Fecha desconocida';
    try {
      final date = DateTime.parse(isoString).toLocal();
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} a las ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return isoString;
    }
  }

  String _statusLabel(String estado) {
    switch (estado) {
      case 'nuevo': return 'Nuevo';
      case 'en_proceso': return 'En proceso';
      case 'resuelto': return 'Resuelto';
      case 'rechazado': return 'Rechazado';
      default: return estado;
    }
  }

  Color _statusColor(String estado) {
    switch (estado) {
      case 'nuevo': return AppColors.primaryBlue;
      case 'en_proceso': return AppColors.orangeNotice;
      case 'resuelto': return AppColors.aquaGreen;
      case 'rechazado': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _statusIcon(String estado) {
    switch (estado) {
      case 'nuevo': return Icons.fiber_new;
      case 'en_proceso': return Icons.autorenew;
      case 'resuelto': return Icons.check_circle_outline;
      case 'rechazado': return Icons.cancel_outlined;
      default: return Icons.help_outline;
    }
  }
}
