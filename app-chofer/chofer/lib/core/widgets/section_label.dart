// lib/core/widgets/section_label.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';

class SectionLabel extends StatelessWidget {
  const SectionLabel({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text.toUpperCase(),
        style: AppTextStyles.label,
      ),
    );
  }
}