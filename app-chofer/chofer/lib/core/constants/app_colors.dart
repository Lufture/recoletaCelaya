// lib/core/constants/app_colors.dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Paleta oficial Municipio de Celaya ────────────────────────────
  static const Color primaryBlue   = Color(0xFF002e7c);
  static const Color aquaGreen     = Color(0xFF017b81);
  static const Color orangeNotice  = Color(0xFFee8901);
  static const Color mustardYellow = Color(0xFFEE964B);
  static const Color lightGrayBg   = Color(0xFFF2F5F8);
  static const Color darkBlue      = Color(0xFF0D3B66);

  // ── Residuos ──────────────────────────────────────────────────────
  static const Color organics      = Color(0xFF2E7D32);
  static const Color recyclables   = Color(0xFF1565C0);
  static const Color sanitary      = Color(0xFFC62828);
  static const Color special       = Color(0xFFE65100);

  // ── Fondos y superficies ──────────────────────────────────────────
  static const Color backgroundPrimary  = lightGrayBg;
  static const Color surface            = Color(0xFFFFFFFF);
  static const Color loginBackground    = primaryBlue;
  static const Color heroGreen          = Color(0xFFE3F4F5);   // aquaGreen claro
  static const Color mapBackground      = lightGrayBg;
  static const Color incidentCardSelected = Color(0xFFE3F4F5);
  static const Color greenDarkBackground  = Color(0xFFCCEEEF);
  static const Color greenDarkBg          = Color(0xFFCCEEEF);
  static const Color unreadTileBackground = Color(0xFFEBF0FB);

  // ── Bordes ────────────────────────────────────────────────────────
  static const Color borderSubtle  = Color(0xFFDDE3ED);

  // ── Texto ─────────────────────────────────────────────────────────
  static const Color textPrimary   = darkBlue;
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted     = Color(0xFF94A3B8);

  // ── Acciones / estado (aliases semánticos) ────────────────────────
  static const Color greenActive   = aquaGreen;
  static const Color greenButton   = aquaGreen;
  static const Color blueInfo      = primaryBlue;
  static const Color amberAlert    = orangeNotice;
  static const Color amber         = orangeNotice;
  static const Color redDanger     = sanitary;
  static const Color redButton     = sanitary;
}