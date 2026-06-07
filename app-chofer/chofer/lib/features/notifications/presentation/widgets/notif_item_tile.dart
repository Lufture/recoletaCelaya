// lib/features/notifications/presentation/widgets/notif_item_tile.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';

class NotifItemTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final String title;
  final String body;
  final String time;
  final bool isUnread;

  const NotifItemTile({
    super.key,
    required this.icon,
    required this.iconBg,
    required this.title,
    required this.body,
    required this.time,
    required this.isUnread,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isUnread ? const Color(0xFF1E2D45) : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isUnread ? AppColors.blueInfo.withOpacity(0.5) : AppColors.borderSubtle,
          width: isUnread ? 1.5 : 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ícono con fondo
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.textPrimary, size: 20),
          ),

          const SizedBox(width: 12),

          // Contenido
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: isUnread ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: AppTextStyles.badge.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 6),
                Text(
                  time,
                  style: AppTextStyles.badge.copyWith(color: AppColors.textMuted),
                ),
              ],
            ),
          ),

          // Dot azul si no leído
          if (isUnread)
            Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.only(top: 4, left: 8),
              decoration: const BoxDecoration(
                color: AppColors.blueInfo,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}