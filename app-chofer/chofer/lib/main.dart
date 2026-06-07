import 'package:flutter/material.dart';
import 'package:recolecta_chofer/app.dart';
import 'package:recolecta_chofer/core/services/supabase_service.dart';
import 'package:recolecta_chofer/core/services/tracking_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.initialize();
  await TrackingService().initializeService();
  runApp(const RecolectaChoferApp());
}