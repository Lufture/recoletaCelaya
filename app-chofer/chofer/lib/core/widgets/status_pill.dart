// lib/core/widgets/status_pill.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';

class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    this.backgroundColor,
    this.textColor,
    this.dotColor,
    this.showDot = true, required Color color,
  });

  final String label;
  final Color? backgroundColor;
  final Color? textColor;
  final Color? dotColor;
  final bool showDot;

  @override
  Widget build(BuildContext context) {
    final bg = backgroundColor ?? AppColors.greenDarkBackground;
    final fg = textColor ?? AppColors.greenActive;
    final dot = dotColor ?? AppColors.greenActive;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: dot,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: AppTextStyles.badge.copyWith(color: fg),
          ),
        ],
      ),
    );
  }
}