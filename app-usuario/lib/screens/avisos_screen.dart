import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/widgets/shared_bottom_nav.dart';
import 'package:recolecta_celaya/services/voice_guide_service.dart';

class AvisosScreen extends StatefulWidget {
  const AvisosScreen({Key? key}) : super(key: key);

  @override
  State<AvisosScreen> createState() => _AvisosScreenState();
}

class _AvisosScreenState extends State<AvisosScreen> {
  final SupabaseClient _supabase = Supabase.instance.client;
  List<dynamic> _avisos = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAvisos();
    
    // Narrar al entrar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      VoiceGuideService.instance.speak("Pantalla de Avisos. Aquí puedes leer las últimas noticias sobre el servicio de recolección.");
    });
  }

  Future<void> _fetchAvisos() async {
    try {
      final response = await _supabase
          .from('avisos')
          .select()
          .eq('activo', true)
          .order('creado_en', ascending: false);

      if (mounted) {
        setState(() {
          _avisos = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Ocurrió un error al cargar los avisos: $e';
          _isLoading = false;
        });
      }
    }
  }

  String _formatearFecha(String isoString) {
    try {
      final date = DateTime.parse(isoString).toLocal();
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return isoString;
    }
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
              child: _buildBody(),
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
            'Avisos',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlue,
            ),
          ),
          Spacer(),
          const Icon(
            Icons.campaign,
            color: AppColors.orangeNotice,
            size: 25,
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 50),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _fetchAvisos();
                },
                child: const Text('Reintentar'),
              )
            ],
          ),
        ),
      );
    }

    if (_avisos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No hay avisos nuevos', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchAvisos,
      color: AppColors.primaryBlue,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _avisos.length,
        itemBuilder: (context, index) {
          final aviso = _avisos[index];
          return _buildAvisoCard(aviso);
        },
      ),
    );
  }

  Widget _buildAvisoCard(Map<String, dynamic> aviso) {
    return GestureDetector(
      onTap: () {
        VoiceGuideService.instance.speak("Aviso: ${aviso['titulo']}. ${aviso['mensaje']}", force: true);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
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
          border: Border(left: BorderSide(color: AppColors.orangeNotice, width: 4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    aviso['titulo'] ?? 'Aviso',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.darkBlue,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.orangeNotice.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.campaign, color: AppColors.orangeNotice, size: 16),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              aviso['mensaje'] ?? '',
              style: TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.4),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  _formatearFecha(aviso['creado_en']),
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
