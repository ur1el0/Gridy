import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../models/document_request_model.dart';

class ClearanceValidatorTab extends StatelessWidget {
  final TextEditingController trackingIdController;
  final bool isVerifying;
  final String? verificationError;
  final DocumentRequestModel? verifiedClearance;
  final VoidCallback onVerify;

  const ClearanceValidatorTab({
    super.key,
    required this.trackingIdController,
    required this.isVerifying,
    required this.verificationError,
    required this.verifiedClearance,
    required this.onVerify,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Clearance Authenticity Validator',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Enter the Document Tracking ID printed on the resident certificate to verify validity.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: trackingIdController,
                  decoration: InputDecoration(
                    hintText: 'e.g. 12 or REQ-12',
                    filled: true,
                    fillColor: AppColors.surface,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: AppRadius.radiusMd,
                      borderSide: const BorderSide(color: AppColors.borderLight),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: AppRadius.radiusMd,
                      borderSide: const BorderSide(color: AppColors.borderLight),
                    ),
                  ),
                  keyboardType: TextInputType.text,
                  onSubmitted: (_) => onVerify(),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: isVerifying ? null : onVerify,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryNavy,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 15,
                  ),
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppRadius.radiusMd,
                  ),
                ),
                child: isVerifying
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Verify',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (verificationError != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceError,
                borderRadius: AppRadius.radiusMd,
                border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
              ),
              child: Text(
                verificationError!,
                style: const TextStyle(
                  color: AppColors.textError,
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
            ),
          if (verifiedClearance != null)
            ClearanceResultCard(request: verifiedClearance!),
        ],
      ),
    );
  }
}

class ClearanceResultCard extends StatelessWidget {
  final DocumentRequestModel request;

  const ClearanceResultCard({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    final isReleased = request.isReleased;
    final verificationLabel = isReleased
        ? 'VALID & AUTHENTIC'
        : request.isReadyForPickup
        ? 'READY FOR PICKUP'
        : request.isRejected
        ? 'REJECTED'
        : 'PENDING APPROVAL';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.radiusLg,
        border: Border.all(
          color: isReleased ? AppColors.success : AppColors.warning,
          width: 1.5,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: isReleased
                      ? AppColors.surfaceSuccess
                      : AppColors.surfaceWarning,
                  borderRadius: AppRadius.radiusSm,
                ),
                child: Row(
                  children: [
                    Icon(
                      isReleased
                          ? Icons.verified_rounded
                          : Icons.pending_actions_rounded,
                      size: 16,
                      color: isReleased
                          ? AppColors.textSuccess
                          : AppColors.textWarning,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      verificationLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: isReleased
                            ? AppColors.textSuccess
                            : AppColors.textWarning,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                request.formattedTrackingId,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            request.documentType,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryNavy,
            ),
          ),
          if (request.purpose != null && request.purpose!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Purpose: ${request.purpose}',
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Status: ${request.statusDisplay}',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          Text(
            'Requested Date: ${request.formattedRequestedDate}',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          if (request.orNumber != null && request.orNumber!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Official Receipt: ${request.orNumber}',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F766E),
              ),
            ),
          ],
          if (request.formattedFee != null) ...[
            const SizedBox(height: 4),
            Text(
              'Treasury Fee: ${request.formattedFee}',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
          if (request.isWalkin) ...[
            const SizedBox(height: 4),
            const Text(
              'Origin: Front Desk Walk-In',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
