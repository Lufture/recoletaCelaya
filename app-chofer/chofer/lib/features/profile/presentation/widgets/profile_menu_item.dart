// lib/features/profile/presentation/widgets/profile_menu_item.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';

class ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const ProfileMenuItem({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          title: Text(
            title,
            style: AppTextStyles.label.copyWith(color: AppColors.textPrimary),
          ),
          subtitle: Text(
            subtitle,
            style: AppTextStyles.badge.copyWith(color: AppColors.textMuted),
          ),
          trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
        ),
      ),
    );
  }
}