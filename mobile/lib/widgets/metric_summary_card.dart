import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

/// 2-column metrics summary row displaying announcement count and pending request count
class MetricSummaryRow extends StatelessWidget {
  final int announcementCount;
  final int pendingRequestCount;
  final bool hasNewAnnouncements;
  final VoidCallback? onAnnouncementsTap;
  final VoidCallback? onPendingRequestsTap;

  const MetricSummaryRow({
    super.key,
    required this.announcementCount,
    required this.pendingRequestCount,
    this.hasNewAnnouncements = true,
    this.onAnnouncementsTap,
    this.onPendingRequestsTap,
  });

  @override
  Widget build(BuildContext context) {
    final annCountStr = announcementCount.toString().padLeft(2, '0');
    final reqCountStr = pendingRequestCount.toString().padLeft(2, '0');

    return Row(
      children: [
        // Announcements Metric Card
        Expanded(
          child: _MetricCard(
            icon: Icons.campaign_outlined,
            iconColor: AppColors.primaryNavy,
            badgeText: hasNewAnnouncements ? 'New' : null,
            count: annCountStr,
            label: 'ANNOUNCEMENTS',
            onTap: onAnnouncementsTap,
          ),
        ),
        const SizedBox(width: 14),

        // My Pending Requests Metric Card
        Expanded(
          child: _MetricCard(
            icon: Icons.assignment_outlined,
            iconColor: const Color(0xFFC2410C), // Warm amber/orange accent
            count: reqCountStr,
            label: 'MY PENDING\nREQUESTS',
            onTap: onPendingRequestsTap,
          ),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String? badgeText;
  final String count;
  final String label;
  final VoidCallback? onTap;

  const _MetricCard({
    required this.icon,
    required this.iconColor,
    this.badgeText,
    required this.count,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 130),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.radiusLg,
        border: Border.all(
          color: AppColors.borderSubtle,
          width: 1.0,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: AppRadius.radiusLg,
        child: InkWell(
          onTap: onTap,
          borderRadius: AppRadius.radiusLg,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Icon and optional Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: iconColor.withValues(alpha: 0.1),
                        borderRadius: AppRadius.radiusSm,
                      ),
                      child: Icon(
                        icon,
                        color: iconColor,
                        size: 20,
                      ),
                    ),
                    if (badgeText != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCyan,
                          borderRadius: AppRadius.radiusPill,
                          border: Border.all(
                            color: const Color(0xFFBAE6FD),
                            width: 1.0,
                          ),
                        ),
                        child: Text(
                          badgeText!,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textInfo,
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                // Numbers and Label
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      count,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.6,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
