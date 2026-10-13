import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

enum StatusBadgeVariant {
  neutral,
  success,
  warning,
  error,
  info,
}

class StatusBadge extends StatelessWidget {
  final String label;
  final StatusBadgeVariant? variant;
  final IconData? icon;
  final Color? customBackgroundColor;
  final Color? customTextColor;
  final Color? customBorderColor;
  final bool isSmall;

  const StatusBadge({
    super.key,
    required this.label,
    this.variant,
    this.icon,
    this.customBackgroundColor,
    this.customTextColor,
    this.customBorderColor,
    this.isSmall = false,
  });

  /// Factory helper that automatically resolves variant from common domain statuses
  factory StatusBadge.fromStatus(
    String status, {
    Key? key,
    IconData? icon,
    bool isSmall = false,
  }) {
    final normalized = status.toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
    final StatusBadgeVariant resolvedVariant;

    if (normalized.contains('RELEASED') ||
        normalized.contains('VERIFIED') ||
        normalized.contains('APPROVED') ||
        normalized.contains('COMPLETED') ||
        normalized.contains('AUTHENTIC') ||
        normalized.contains('SUCCESS')) {
      resolvedVariant = StatusBadgeVariant.success;
    } else if (normalized.contains('PENDING') ||
        normalized.contains('WAITING') ||
        normalized.contains('AWAITING') ||
        normalized.contains('IN_REVIEW') ||
        normalized.contains('REVIEW') ||
        normalized.contains('UNVERIFIED')) {
      resolvedVariant = StatusBadgeVariant.warning;
    } else if (normalized.contains('REJECTED') ||
        normalized.contains('CANCELLED') ||
        normalized.contains('CANCELED') ||
        normalized.contains('INVALID') ||
        normalized.contains('FAILED') ||
        normalized.contains('ERROR')) {
      resolvedVariant = StatusBadgeVariant.error;
    } else if (normalized.contains('PROCESSING') ||
        normalized.contains('SERVING') ||
        normalized.contains('READY') ||
        normalized.contains('ASSESSED') ||
        normalized.contains('CALLING') ||
        normalized.contains('STATUTORY_EXEMPT')) {
      resolvedVariant = StatusBadgeVariant.info;
    } else {
      resolvedVariant = StatusBadgeVariant.neutral;
    }

    // Format display string (e.g. READY_FOR_PICKUP -> Ready for Pickup)
    final displayLabel = _formatStatusLabel(status);

    return StatusBadge(
      key: key,
      label: displayLabel,
      variant: resolvedVariant,
      icon: icon,
      isSmall: isSmall,
    );
  }

  static String _formatStatusLabel(String raw) {
    if (raw.isEmpty) return '';
    return raw
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => word.isNotEmpty
            ? '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}'
            : '')
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final effectiveVariant = variant ?? StatusBadgeVariant.neutral;

    Color bg;
    Color fg;
    Color border;

    switch (effectiveVariant) {
      case StatusBadgeVariant.success:
        bg = AppColors.surfaceSuccess;
        fg = AppColors.textSuccess;
        border = const Color(0xFFA7F3D0);
        break;
      case StatusBadgeVariant.warning:
        bg = AppColors.surfaceWarning;
        fg = AppColors.textWarning;
        border = const Color(0xFFFDE68A);
        break;
      case StatusBadgeVariant.error:
        bg = AppColors.surfaceError;
        fg = AppColors.textError;
        border = const Color(0xFFFECACA);
        break;
      case StatusBadgeVariant.info:
        bg = AppColors.surfaceCyan;
        fg = AppColors.textInfo;
        border = const Color(0xFFBAE6FD);
        break;
      case StatusBadgeVariant.neutral:
        bg = AppColors.surfaceNavy;
        fg = AppColors.primaryNavy;
        border = AppColors.borderLight;
        break;
    }

    if (customBackgroundColor != null) bg = customBackgroundColor!;
    if (customTextColor != null) fg = customTextColor!;
    if (customBorderColor != null) border = customBorderColor!;

    final verticalPadding = isSmall ? 2.0 : 4.0;
    final horizontalPadding = isSmall ? 7.0 : 10.0;
    final fontSize = isSmall ? 10.5 : 11.5;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: AppRadius.radiusPill,
        border: Border.all(color: border, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize + 1, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: fg,
              letterSpacing: 0.2,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
