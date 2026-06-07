import 'package:flutter_tts/flutter_tts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class VoiceGuideService {
  // Singleton instance
  static final VoiceGuideService _instance = VoiceGuideService._internal();
  static VoiceGuideService get instance => _instance;

  final FlutterTts _flutterTts = FlutterTts();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  bool _isEnabled = false;
  bool get isEnabled => _isEnabled;

  VoiceGuideService._internal();

  /// Inicializa el servicio cargando la preferencia guardada y configurando el idioma.
  Future<void> init() async {
    // Leer preferencia
    final String? storedValue = await _storage.read(key: 'voice_guide_enabled');
    _isEnabled = storedValue == 'true';

    // Configurar idioma español, tono amigable y velocidad moderada
    await _flutterTts.setLanguage("es-MX");
    await _flutterTts.setSpeechRate(0.45); // Un poco más lento para que sea claro
    await _flutterTts.setPitch(1.1); // Tono un poco más ameno
  }

  /// Cambia el estado de la guía de voz y guarda la preferencia.
  Future<void> setEnabled(bool value) async {
    _isEnabled = value;
    await _storage.write(key: 'voice_guide_enabled', value: value.toString());
    
    if (_isEnabled) {
      speak("Guía de voz activada.");
    } else {
      stop();
    }
  }

  /// Lee el texto en voz alta solo si la guía de voz está activada o si se fuerza su lectura.
  Future<void> speak(String text, {bool force = false}) async {
    if (_isEnabled || force) {
      await _flutterTts.speak(text);
    }
  }

  /// Detiene la lectura actual.
  Future<void> stop() async {
    await _flutterTts.stop();
  }
}
