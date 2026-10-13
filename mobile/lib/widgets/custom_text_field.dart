import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? hintText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;
  final bool enabled;

  const CustomTextField({
    super.key,
    required this.label,
    this.controller,
    this.hintText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.validator,
    this.onFieldSubmitted,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label.toUpperCase(), style: theme.textTheme.labelMedium),
        const SizedBox(height: 8),
        Semantics(
          label: label.toUpperCase(),
          child: TextFormField(
            controller: controller,
            obscureText: obscureText,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            validator: validator,
            onFieldSubmitted: onFieldSubmitted,
            enabled: enabled,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: hintText,
              prefixIcon: prefixIcon != null
                  ? Icon(prefixIcon, color: AppColors.textMuted, size: 20)
                  : null,
              suffixIcon: suffixIcon,
            ),
          ),
        ),
      ],
    );
  }
}
