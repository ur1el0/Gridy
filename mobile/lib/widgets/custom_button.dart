import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double height;
  final Color backgroundColor;
  final Color textColor;
  final bool isOutlined;
  final bool isFullWidth;
  final BorderRadius? borderRadius;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon = Icons.arrow_forward_rounded,
    this.height = 52.0,
    this.backgroundColor = AppColors.primaryNavy,
    this.textColor = Colors.white,
    this.isOutlined = false,
    this.isFullWidth = true,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = borderRadius ?? AppRadius.radiusMd;
    final effectiveHeight = height < 48.0 ? 48.0 : height; // Minimum 48dp touch target
    final isEnabled = onPressed != null && !isLoading;

    final Color effectiveBg;
    final Color effectiveFg;
    final Border? effectiveBorder;

    if (isOutlined) {
      effectiveBg = Colors.transparent;
      effectiveFg = isEnabled ? backgroundColor : AppColors.textMuted;
      effectiveBorder = Border.all(
        color: isEnabled ? backgroundColor : AppColors.borderLight,
        width: 1.5,
      );
    } else {
      effectiveBg = isEnabled
          ? backgroundColor
          : backgroundColor.withValues(alpha: 0.5);
      effectiveFg = textColor;
      effectiveBorder = null;
    }

    final buttonContent = Container(
      width: isFullWidth ? double.infinity : null,
      height: effectiveHeight,
      constraints: const BoxConstraints(minHeight: 48.0),
      decoration: BoxDecoration(
        color: effectiveBg,
        borderRadius: effectiveRadius,
        border: effectiveBorder,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: effectiveRadius,
        child: InkWell(
          onTap: isEnabled ? onPressed : null,
          borderRadius: effectiveRadius,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Center(
              child: isLoading
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor: AlwaysStoppedAnimation<Color>(effectiveFg),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          text,
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                            color: effectiveFg,
                            letterSpacing: 0.2,
                          ),
                        ),
                        if (icon != null) ...[
                          const SizedBox(width: 8),
                          Icon(
                            icon,
                            color: effectiveFg,
                            size: 18,
                          ),
                        ],
                      ],
                    ),
            ),
          ),
        ),
      ),
    );

    return buttonContent;
  }
}
