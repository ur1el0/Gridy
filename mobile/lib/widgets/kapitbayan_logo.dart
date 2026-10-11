import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

class KapitBayanLogo extends StatelessWidget {
  final double iconSize;
  final double textSize;
  final bool showText;

  const KapitBayanLogo({
    super.key,
    this.iconSize = 64,
    this.textSize = 24,
    this.showText = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/images/kapitbayan_symbol.png',
          width: iconSize,
          height: iconSize,
          fit: BoxFit.contain,
          semanticLabel: 'KapitBayan',
          excludeFromSemantics: showText,
        ),
        if (showText) ...[
          const SizedBox(height: 12),
          Text(
            'KapitBayan',
            style: TextStyle(
              fontSize: textSize,
              fontWeight: FontWeight.w900,
              color: AppColors.primaryNavy,
              letterSpacing: 2.0,
            ),
          ),
        ],
      ],
    );
  }
}
