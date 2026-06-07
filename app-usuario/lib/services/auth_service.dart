import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Sign up with Email and Password
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String nombre,
    required String telefono,
  }) async {
    // 1. Crear el usuario en Supabase Auth
    final response = await _supabase.auth.signUp(
      email: email,
      password: password,
    );

    if (response.user != null) {
      // 2. Insertar los datos adicionales en la tabla pública 'perfiles'
      try {
        await _supabase.from('perfiles').insert({
          'id': response.user!.id,
          'correo': email,
          'nombre': nombre,
          'telefono': telefono,
          'rol': 'ciudadano', // Rol por defecto
          'activo': true,
        });
      } catch (e) {
        // En caso de que falle la inserción del perfil, podríamos manejar el error
        // pero por ahora lanzamos la excepción para verla en UI
        rethrow;
      }
    }
    return response;
  }

  // Sign in with Email and Password
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  // Sign out
  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }
}
