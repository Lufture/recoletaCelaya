import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:recolecta_celaya/screens/alerts_screen.dart';
import 'package:recolecta_celaya/screens/dashboard_screen.dart';
import 'package:recolecta_celaya/screens/login_screen.dart';
import 'package:recolecta_celaya/screens/perfil_screen.dart';
import 'package:recolecta_celaya/screens/registro_screen.dart';
import 'package:recolecta_celaya/screens/reports_screen.dart';
import 'package:recolecta_celaya/screens/waste_guide_screen.dart';
import 'package:recolecta_celaya/screens/avisos_screen.dart';
import 'package:recolecta_celaya/screens/edit_location_screen.dart';
import 'package:recolecta_celaya/screens/mapa_camion_screen.dart';
import 'package:recolecta_celaya/widgets/auth_wrapper.dart';
import 'package:recolecta_celaya/services/voice_guide_service.dart';
import 'package:recolecta_celaya/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar servicio de guía de voz
  await VoiceGuideService.instance.init();

  // Inicializar notificaciones locales
  await NotificationService().init();
    
  await Supabase.initialize(
    url: 'https://pzhiapfwwkidutqdrrvm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aGlhcGZ3d2tpZHV0cWRycnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAyOTQsImV4cCI6MjA5NDk2NjI5NH0.TW2lx_faeZOiiwyCVglt0V7YeGrEuhsmHvFcEEDMRX4',
  );

  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Recolecta Celaya',
      theme: ThemeData(
        fontFamily: 'Poppins',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF002e7c),
          primary: const Color(0xFF002e7c),
          secondary: const Color(0xFF017b81),
        ),
        useMaterial3: true,
      ),
      // Home: AuthWrapper decide a dónde ir
      initialRoute: '/',
      routes: {
        '/':            (_) => const AuthWrapper(),
        '/login':       (_) => const LoginScreen(),
        '/registro':    (_) => const RegistroScreen(),
        '/dashboard':   (_) => const DashboardScreen(),
        '/alerts':      (_) => const AlertsScreen(),
        '/perfil':      (_) => const PerfilScreen(),
        '/waste-guide': (_) => const WasteGuideScreen(),
        '/reports':     (_) => const ReportsScreen(),
        '/avisos':      (_) => const AvisosScreen(),
        '/edit-location': (_) => const EditLocationScreen(),
        '/mapa-camion': (_) => const MapaCamionScreen(),
      },
    );
  }
}
