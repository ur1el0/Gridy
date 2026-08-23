import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Quick services section providing immediate access to common resident actions
class QuickServicesSection extends StatelessWidget {
  final VoidCallback? onRequestDocument;
  final VoidCallback? onReportIssue;
  final VoidCallback? onBarangayHotline;

  const QuickServicesSection({
    super.key,
    this.onRequestDocument,
    this.onReportIssue,
    this.onBarangayHotline,
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
                onTap: onRequestDocument,
              ),
            ),
            const SizedBox(width: 14),
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

        // Row 2: Barangay Hotline
        Row(
          children: [
            Expanded(
              child: _QuickServiceCard(
                icon: Icons.phone_outlined,
                title: 'Barangay Hotline',
                onTap: onBarangayHotline,
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(child: SizedBox()), // Placeholder spacer to match grid layout
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
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
        border: Border.all(
          color: const Color(0xFFF1F5F9),
          width: 1.2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Soft blue container around icon
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: AppColors.primaryNavy,
                    size: 18,
                  ),
                ),

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
