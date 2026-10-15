import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import 'app_surface.dart';

/// Quick services section providing immediate access to common resident actions
class QuickServicesSection extends StatelessWidget {
  final VoidCallback? onRequestDocument;
  final VoidCallback? onReportIssue;
  final VoidCallback? onBarangayHotline;
  final VoidCallback? onMyReports;
  final VoidCallback? onRequestAid;
  final VoidCallback? onAskBarangay;
  final bool showAskBarangay;

  const QuickServicesSection({
    super.key,
    this.onRequestDocument,
    this.onReportIssue,
    this.onBarangayHotline,
    this.onMyReports,
    this.onRequestAid,
    this.onAskBarangay,
    this.showAskBarangay = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Services', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),

        // Row 1: Request Document & Report Issue
        Row(
          children: [
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.description_outlined,
                title: 'Request Document',
                onTap: onRequestDocument,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.pest_control_outlined,
                title: 'Report Issue',
                onTap: onReportIssue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (showAskBarangay)
          Row(
            children: [
              Expanded(
                child: _QuickServiceCard(
                  icon: Icons.volunteer_activism_outlined,
                  title: 'Request Assistance',
                  onTap: onRequestAid,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickServiceCard(
                  icon: Icons.auto_awesome_outlined,
                  title: 'Ask Barangay',
                  onTap: onAskBarangay,
                ),
              ),
            ],
          )
        else
          _QuickServiceCard(
            icon: Icons.volunteer_activism_outlined,
            title: 'Request Assistance',
            onTap: onRequestAid,
          ),
        const SizedBox(height: 12),

        // Row 2: Barangay Hotline & My Reports
        Row(
          children: [
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.phone_outlined,
                title: 'Barangay Hotline',
                onTap: onBarangayHotline,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.history_outlined,
                title: 'My Reports',
                onTap: onMyReports,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickServiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onTap;

  const _QuickServiceCard({
    required this.icon,
    required this.title,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 104),
      child: AppSurface(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.primaryNavy.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: SizedBox(
                    width: 36,
                    height: 36,
                    child: Icon(icon, color: AppColors.primaryNavy, size: 20),
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: AppColors.textMuted,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: AppColors.textPrimary,
                height: 1.25,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
