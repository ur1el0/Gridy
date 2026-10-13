import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

/// Quick services section providing immediate access to common resident actions
class QuickServicesSection extends StatelessWidget {
  final VoidCallback? onRequestDocument;
  final VoidCallback? onReportIssue;
  final VoidCallback? onBarangayHotline;
  final VoidCallback? onMyReports;
  final VoidCallback? onRequestAid;

  const QuickServicesSection({
    super.key,
    this.onRequestDocument,
    this.onReportIssue,
    this.onBarangayHotline,
    this.onMyReports,
    this.onRequestAid,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Services',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 12),

        // Row 1: Request Document & Report Issue
        Row(
          children: [
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.description_outlined,
                title: 'Request Document',
                iconColor: AppColors.primaryNavy,
                iconBgColor: AppColors.surfaceNavy,
                onTap: onRequestDocument,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.pest_control_outlined,
                title: 'Report Issue',
                iconColor: const Color(0xFFB45309), // Amber 700
                iconBgColor: AppColors.surfaceWarning,
                onTap: onReportIssue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Row 2: Request Assistance & My Reports
        Row(
          children: [
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.volunteer_activism_outlined,
                title: 'Request Assistance',
                iconColor: const Color(0xFF047857), // Emerald 700
                iconBgColor: AppColors.surfaceSuccess,
                onTap: onRequestAid,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.history_outlined,
                title: 'My Reports',
                iconColor: const Color(0xFF0369A1), // Sky 700
                iconBgColor: AppColors.surfaceCyan,
                onTap: onMyReports,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Row 3: Barangay Hotline (Full width emergency contact card)
        _QuickServiceCard(
          icon: Icons.phone_in_talk_outlined,
          title: 'Barangay Hotline',
          subtitle: 'Emergency dispatch & barangay hall assistance',
          iconColor: AppColors.error,
          iconBgColor: AppColors.surfaceError,
          onTap: onBarangayHotline,
          isFullWidth: true,
        ),
      ],
    );
  }
}

class _QuickServiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color iconColor;
  final Color iconBgColor;
  final VoidCallback? onTap;
  final bool isFullWidth;

  const _QuickServiceCard({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.iconColor,
    required this.iconBgColor,
    this.onTap,
    this.isFullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 76),
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
      child: Material(
        color: Colors.transparent,
        borderRadius: AppRadius.radiusMd,
        child: InkWell(
          onTap: onTap,
          borderRadius: AppRadius.radiusMd,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
            child: isFullWidth
                ? Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: iconBgColor,
                          borderRadius: AppRadius.radiusSm,
                        ),
                        child: Icon(icon, color: iconColor, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              title,
                              style: const TextStyle(
                                fontSize: 14.0,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            if (subtitle != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                subtitle!,
                                style: const TextStyle(
                                  fontSize: 12.0,
                                  color: AppColors.textSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.textSecondary,
                        size: 20,
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: iconBgColor,
                          borderRadius: AppRadius.radiusSm,
                        ),
                        child: Icon(icon, color: iconColor, size: 20),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
