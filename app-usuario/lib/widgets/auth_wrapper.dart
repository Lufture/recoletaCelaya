import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:recolecta_celaya/screens/dashboard_screen.dart';
import 'package:recolecta_celaya/screens/login_screen.dart';
import 'package:recolecta_celaya/screens/registro_screen.dart';

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _hasAddress = false;

  @override
  void initState() {
    super.initState();
    _checkInitialAuth();
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (!mounted) return;
      final AuthChangeEvent event = data.event;
      if (event == AuthChangeEvent.signedIn) {
        _checkUserAddress();
      } else if (event == AuthChangeEvent.signedOut) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  Future<void> _checkInitialAuth() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      await _checkUserAddress();
    } else {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _checkUserAddress() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        // Verificar si existe al menos un domicilio para este usuario
        final response = await Supabase.instance.client
            .from('domicilios_usuario')
            .select('id')
            .eq('usuario_id', user.id)
            .limit(1);

        setState(() {
          _hasAddress = (response as List).isNotEmpty;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error al verificar domicilio: $e');
      setState(() {
        _isLoading = false;
        // Ante la duda (ej. error de red), mostramos el dashboard si ya está logueado
        // o podemos forzar el registro. Asumiremos que no tiene si falla.
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return const LoginScreen();
    }

    if (_hasAddress) {
      return const DashboardScreen();
    } else {
      return const RegistroScreen();
    }
  }
}
