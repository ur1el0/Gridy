import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

/// Side-by-side metric summary cards displaying estimated wait time and live desk capacity
class QueueMetricCards extends StatelessWidget {
  final String estimatedCallTime;
  final String liveCapacity;

  const QueueMetricCards({
    super.key,
    required this.estimatedCallTime,
    required this.liveCapacity,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // 1. Estimated Call Card
        Expanded(
          child: Container(
            constraints: const BoxConstraints(minHeight: 105),
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.radiusMd,
              border: Border.all(color: AppColors.borderSubtle, width: 1.0),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceWarning,
                        borderRadius: AppRadius.radiusSm,
                      ),
                      child: const Icon(
                        Icons.access_time_rounded,
                        color: Color(0xFFD97706),
                        size: 18,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'ESTIMATED CALL',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  estimatedCallTime,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 12),

        // 2. Live Capacity Card
        Expanded(
          child: Container(
            constraints: const BoxConstraints(minHeight: 105),
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.radiusMd,
              border: Border.all(color: AppColors.borderSubtle, width: 1.0),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceNavy,
                        borderRadius: AppRadius.radiusSm,
                      ),
                      child: const Icon(
                        Icons.insights_rounded,
                        color: AppColors.primaryNavy,
                        size: 18,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'LIVE CAPACITY',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  liveCapacity,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
