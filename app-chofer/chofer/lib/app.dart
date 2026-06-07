// lib/app.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_routes.dart';
import 'package:recolecta_chofer/core/theme/app_theme.dart';
import 'package:recolecta_chofer/features/auth/presentation/screens/login_screen.dart';
import 'package:recolecta_chofer/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:recolecta_chofer/features/map/presentation/screens/map_screen.dart';
import 'package:recolecta_chofer/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:recolecta_chofer/features/profile/presentation/screens/profile_screen.dart';
import 'package:recolecta_chofer/features/report/presentation/screens/report_screen.dart';
import 'package:recolecta_chofer/features/route/presentation/screens/route_screen.dart';

class RecolectaChoferApp extends StatelessWidget {
  const RecolectaChoferApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RecolecTA Chofer',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      initialRoute: AppRoutes.login,
      routes: {
        AppRoutes.login: (_) => const LoginScreen(),
        AppRoutes.dashboard: (_) => const DashboardScreen(),
        AppRoutes.route: (_) => const RouteScreen(),
        AppRoutes.map: (_) => const MapScreen(),
        AppRoutes.report: (_) => const ReportScreen(),
        AppRoutes.notifications: (_) => const NotificationsScreen(),
        AppRoutes.profile: (_) => const ProfileScreen(),
      },
    );
  }
}