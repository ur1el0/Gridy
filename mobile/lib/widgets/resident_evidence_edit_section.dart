import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/widgets/custom_text_field.dart';

/// Interactive section for editing, replacing, or removing resident identity & residency proofs
class ResidentEvidenceEditSection extends StatelessWidget {
  final UserModel user;
  final TextEditingController philsysIdController;
  final XFile? newPhilsysPhoto;
  final bool removePhilsysPhoto;
  final VoidCallback onPickPhilsysPhoto;
  final VoidCallback onRemovePhilsysPhoto;
  final VoidCallback onUndoPhilsysRemoval;
  final VoidCallback onClearPhilsysFile;

  final String? secondaryIdType;
  final List<String> secondaryIdTypes;
  final ValueChanged<String?> onSecondaryIdTypeChanged;
  final XFile? newSecondaryIdPhoto;
  final bool removeSecondaryIdPhoto;
  final VoidCallback onPickSecondaryPhoto;
  final VoidCallback onRemoveSecondaryPhoto;
  final VoidCallback onUndoSecondaryRemoval;
  final VoidCallback onClearSecondaryFile;

  final String? utilityBillingType;
  final List<String> utilityBillingTypes;
  final ValueChanged<String?> onUtilityBillingTypeChanged;
  final XFile? newUtilityBillingPhoto;
  final bool removeUtilityBillingPhoto;
  final VoidCallback onPickUtilityPhoto;
  final VoidCallback onRemoveUtilityPhoto;
  final VoidCallback onUndoUtilityRemoval;
  final VoidCallback onClearUtilityFile;

  final bool canRemoveProof;
  final bool isSaving;

  const ResidentEvidenceEditSection({
    super.key,
    required this.user,
    required this.philsysIdController,
    required this.newPhilsysPhoto,
    required this.removePhilsysPhoto,
    required this.onPickPhilsysPhoto,
    required this.onRemovePhilsysPhoto,
    required this.onUndoPhilsysRemoval,
    required this.onClearPhilsysFile,
    required this.secondaryIdType,
    required this.secondaryIdTypes,
    required this.onSecondaryIdTypeChanged,
    required this.newSecondaryIdPhoto,
    required this.removeSecondaryIdPhoto,
    required this.onPickSecondaryPhoto,
    required this.onRemoveSecondaryPhoto,
    required this.onUndoSecondaryRemoval,
    required this.onClearSecondaryFile,
    required this.utilityBillingType,
    required this.utilityBillingTypes,
    required this.onUtilityBillingTypeChanged,
    required this.newUtilityBillingPhoto,
    required this.removeUtilityBillingPhoto,
    required this.onPickUtilityPhoto,
    required this.onRemoveUtilityPhoto,
    required this.onUndoUtilityRemoval,
    required this.onClearUtilityFile,
    required this.canRemoveProof,
    required this.isSaving,
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
        const SizedBox(height: 6),
        const Text(
          'Residents must maintain at least one valid identity or residency proof document on file. You can replace existing documents or add additional proofs.',
          style: TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
            height: 1.35,
          ),
        ),
        const SizedBox(height: 16),

        // 1. PhilSys ID
        CustomTextField(
          label: 'PHILSYS NATIONAL ID NUMBER',
          controller: philsysIdController,
          hintText: 'e.g. 1234-5678-9012-3456',
          prefixIcon: Icons.fingerprint_rounded,
          enabled: !isSaving,
        ),
        const SizedBox(height: 8),
        const Text(
          'PHILSYS ID PHOTO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        _buildEvidenceItemEdit(
          context: context,
          label: 'Upload PhilSys ID Photo',
          hasExisting: user.hasPhilsysPhoto,
          newFile: newPhilsysPhoto,
          isMarkedForRemoval: removePhilsysPhoto,
          canRemove: canRemoveProof,
          onPick: onPickPhilsysPhoto,
          onRemoveExisting: onRemovePhilsysPhoto,
          onUndoRemoval: onUndoPhilsysRemoval,
          onClearNewFile: onClearPhilsysFile,
        ),

        const SizedBox(height: 18),

        // 2. Secondary Valid ID
        const Text(
          'SECONDARY ID TYPE',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonFormField<String>(
            initialValue: secondaryIdType,
            isExpanded: true,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              prefixIcon: Icon(
                Icons.credit_card_outlined,
                color: AppColors.textMuted,
                size: 20,
              ),
            ),
            items: secondaryIdTypes
                .map(
                  (type) => DropdownMenuItem(
                    value: type,
                    child: Text(
                      type,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                )
                .toList(),
            onChanged: isSaving ? null : onSecondaryIdTypeChanged,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'SECONDARY ID PHOTO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        _buildEvidenceItemEdit(
          context: context,
          label: 'Upload Secondary ID Photo',
          hasExisting: user.hasSecondaryIdPhoto,
          newFile: newSecondaryIdPhoto,
          isMarkedForRemoval: removeSecondaryIdPhoto,
          canRemove: canRemoveProof,
          onPick: onPickSecondaryPhoto,
          onRemoveExisting: onRemoveSecondaryPhoto,
          onUndoRemoval: onUndoSecondaryRemoval,
          onClearNewFile: onClearSecondaryFile,
        ),

        const SizedBox(height: 18),

        // 3. Proof of Residency
        const Text(
          'BILLING STATEMENT TYPE',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonFormField<String>(
            initialValue: utilityBillingType,
            isExpanded: true,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              prefixIcon: Icon(
                Icons.receipt_long_outlined,
                color: AppColors.textMuted,
                size: 20,
              ),
            ),
            items: utilityBillingTypes
                .map(
                  (type) => DropdownMenuItem(
                    value: type,
                    child: Text(
                      type,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                )
                .toList(),
            onChanged: isSaving ? null : onUtilityBillingTypeChanged,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'BILLING STATEMENT PHOTO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        _buildEvidenceItemEdit(
          context: context,
          label: 'Upload Billing Statement Photo',
          hasExisting: user.hasUtilityBillingPhoto,
          newFile: newUtilityBillingPhoto,
          isMarkedForRemoval: removeUtilityBillingPhoto,
          canRemove: canRemoveProof,
          onPick: onPickUtilityPhoto,
          onRemoveExisting: onRemoveUtilityPhoto,
          onUndoRemoval: onUndoUtilityRemoval,
          onClearNewFile: onClearUtilityFile,
        ),
      ],
    );
  }

  Widget _buildEvidenceItemEdit({
    required BuildContext context,
    required String label,
    required bool hasExisting,
    required XFile? newFile,
    required bool isMarkedForRemoval,
    required bool canRemove,
    required VoidCallback onPick,
    required VoidCallback onRemoveExisting,
    required VoidCallback onUndoRemoval,
    required VoidCallback onClearNewFile,
  }) {
    final bool hasFileActive =
        newFile != null || (hasExisting && !isMarkedForRemoval);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isMarkedForRemoval
              ? const Color(0xFFF59E0B)
              : hasFileActive
                  ? const Color(0xFF10B981)
                  : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(
            isMarkedForRemoval
                ? Icons.delete_outline_rounded
                : hasFileActive
                    ? Icons.check_circle_rounded
                    : Icons.upload_file_rounded,
            color: isMarkedForRemoval
                ? const Color(0xFFF59E0B)
                : hasFileActive
                    ? const Color(0xFF10B981)
                    : const Color(0xFF94A3B8),
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  newFile != null
                      ? newFile.name
                      : isMarkedForRemoval
                          ? 'Marked for removal'
                          : hasExisting
                              ? 'Document on file'
                              : label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight:
                        hasFileActive ? FontWeight.w600 : FontWeight.w500,
                    color: isMarkedForRemoval
                        ? const Color(0xFFD97706)
                        : hasFileActive
                            ? AppColors.textPrimary
                            : const Color(0xFF94A3B8),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (hasExisting && !isMarkedForRemoval && newFile == null)
                  const Text(
                    'Tap replace to change or remove to delete',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          if (newFile != null) ...[
            IconButton(
              tooltip: 'Clear new selection',
              icon: const Icon(
                Icons.close_rounded,
                size: 20,
                color: Color(0xFFEF4444),
              ),
              onPressed: isSaving ? null : onClearNewFile,
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              padding: const EdgeInsets.all(12),
            ),
          ] else if (isMarkedForRemoval) ...[
            TextButton(
              onPressed: isSaving ? null : onUndoRemoval,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
                minimumSize: const Size(48, 48),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: const Text('UNDO'),
            ),
          ] else if (hasExisting) ...[
            TextButton(
              onPressed: isSaving ? null : onPick,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
                minimumSize: const Size(48, 48),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: const Text('REPLACE'),
            ),
            const SizedBox(width: 4),
            IconButton(
              tooltip: canRemove
                  ? 'Remove document'
                  : 'Cannot remove: at least one proof must remain on file',
              icon: Icon(
                Icons.delete_outline_rounded,
                size: 20,
                color:
                    canRemove ? const Color(0xFFEF4444) : Colors.grey.shade400,
              ),
              onPressed: isSaving
                  ? null
                  : canRemove
                      ? onRemoveExisting
                      : () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Cannot remove: residents must maintain at least one identity or residency proof document on file. You may replace this document instead.',
                              ),
                              backgroundColor: Color(0xFFD97706),
                            ),
                          );
                        },
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              padding: const EdgeInsets.all(12),
            ),
          ] else ...[
            TextButton(
              onPressed: isSaving ? null : onPick,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
                minimumSize: const Size(48, 48),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: const Text('SELECT'),
            ),
          ],
        ],
      ),
    );
  }
}
