import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/theme/app_colors.dart';

class GridyLogo extends StatelessWidget {
  final double iconSize;
  final double textSize;
  final bool showText;

  const GridyLogo({
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
        // App Icon Badge matching frontend
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            color: const Color(0xFF091B35),
            borderRadius: BorderRadius.circular(iconSize * 0.26),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF091B35).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: EdgeInsets.all(iconSize * 0.14),
          child: SvgPicture.asset(
            'assets/images/MainLogo.svg',
            fit: BoxFit.contain,
          ),
        ),
        if (showText) ...[
          const SizedBox(height: 12),
          Text(
            'GRIDY',
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
