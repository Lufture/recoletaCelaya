// lib/features/route/presentation/widgets/colony_item_tile.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';

enum ColonyStatus { done, active, pending }

class ColonyItemTile extends StatelessWidget {
  const ColonyItemTile({
    super.key,
    required this.name,
    required this.time,
    required this.status,
    this.distanceKm,
  });

  final String name;
  final String time;
  final ColonyStatus status;
  final String? distanceKm;

  Color get _dotColor {
    switch (status) {
      case ColonyStatus.done:
        return AppColors.greenActive;
      case ColonyStatus.active:
        return AppColors.amberAlert;
      case ColonyStatus.pending:
        return AppColors.textMuted;
    }
  }

  Widget? get _trailingIcon {
    switch (status) {
      case ColonyStatus.done:
        return const Icon(Icons.check_circle, color: AppColors.greenActive, size: 22);
      case ColonyStatus.active:
        return const Icon(Icons.local_shipping, color: AppColors.amberAlert, size: 22);
      case ColonyStatus.pending:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isActive = status == ColonyStatus.active;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isActive ? AppColors.amberAlert.withOpacity(0.06) : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? AppColors.amberAlert.withOpacity(0.4) : AppColors.borderSubtle,
          width: isActive ? 1.5 : 1,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: _dotColor, shape: BoxShape.circle),
        ),
        title: Text(
          name,
          style: AppTextStyles.body.copyWith(
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
            color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
        subtitle: Text(time, style: AppTextStyles.label),
        trailing: _trailingIcon,
      ),
    );
  }
}