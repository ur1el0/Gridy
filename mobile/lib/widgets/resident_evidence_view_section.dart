import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/models/user_model.dart';

/// Read-only section rendering resident identity & residency proof status
class ResidentEvidenceViewSection extends StatelessWidget {
  final UserModel user;
  final void Function(String title, String relativeUrl) onViewDocument;

  const ResidentEvidenceViewSection({
    super.key,
    required this.user,
    required this.onViewDocument,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'IDENTITY & RESIDENCY PROOF',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Color(0xFF64748B),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),
        _buildEvidenceViewTile(
          title: 'PhilSys National ID',
          subtitle: user.hasPhilsysPhoto
              ? (user.philsysIdNumber != null && user.philsysIdNumber!.isNotEmpty
                  ? 'ID No: ${user.philsysIdNumber}'
                  : 'Document on file')
              : 'Not on file',
          isOnFile: user.hasPhilsysPhoto,
          onView: user.hasPhilsysPhoto
              ? () => onViewDocument(
                    'PhilSys National ID',
                    user.philsysIdPhoto!,
                  )
              : null,
        ),
        const SizedBox(height: 10),
        _buildEvidenceViewTile(
          title: 'Secondary Valid ID',
          subtitle: user.hasSecondaryIdPhoto
              ? '${user.secondaryIdType ?? "Valid ID"} (On file)'
              : 'Not on file',
          isOnFile: user.hasSecondaryIdPhoto,
          onView: user.hasSecondaryIdPhoto
              ? () => onViewDocument(
                    'Secondary ID (${user.secondaryIdType ?? "Valid ID"})',
                    user.secondaryIdPhoto!,
                  )
              : null,
        ),
        const SizedBox(height: 10),
        _buildEvidenceViewTile(
          title: 'Proof of Residency',
          subtitle: user.hasUtilityBillingPhoto
              ? '${user.utilityBillingType ?? "Billing statement"} (On file)'
              : 'Not on file',
          isOnFile: user.hasUtilityBillingPhoto,
          onView: user.hasUtilityBillingPhoto
              ? () => onViewDocument(
                    'Proof of Residency (${user.utilityBillingType ?? "Billing"})',
                    user.utilityBillingPhoto!,
                  )
              : null,
        ),
        if (user.proofDocumentsCount == 0)
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Text(
              'No documents on file. Tap "Edit Profile" above to upload verification documents.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.amber.shade800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildEvidenceViewTile({
    required String title,
    required String subtitle,
    required bool isOnFile,
    VoidCallback? onView,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.inputBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnFile ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isOnFile ? Icons.verified_user_rounded : Icons.file_present_outlined,
            color: isOnFile ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isOnFile ? FontWeight.w600 : FontWeight.w400,
                    color: isOnFile
                        ? const Color(0xFF047857)
                        : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (isOnFile && onView != null)
            TextButton(
              onPressed: onView,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
                minimumSize: const Size(48, 48),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: const Text('VIEW'),
            ),
        ],
      ),
    );
  }
}
