import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../models/payment_recipient_model.dart';

class DocumentPaymentSection extends StatelessWidget {
  final bool canSubmitElectronicPayment;
  final bool isLoadingRecipients;
  final String? recipientError;
  final List<PaymentRecipientModel> recipients;
  final int? selectedRecipientId;
  final TextEditingController referenceController;
  final bool isSubmitting;
  final ValueChanged<int?> onSelectedRecipientChanged;
  final VoidCallback onSubmitPaymentReference;

  const DocumentPaymentSection({
    super.key,
    required this.canSubmitElectronicPayment,
    required this.isLoadingRecipients,
    required this.recipientError,
    required this.recipients,
    required this.selectedRecipientId,
    required this.referenceController,
    required this.isSubmitting,
    required this.onSelectedRecipientChanged,
    required this.onSubmitPaymentReference,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (canSubmitElectronicPayment) ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choose the official recipient configured by your barangay. Staff will verify the transfer reference manually before release.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                if (isLoadingRecipients) const LinearProgressIndicator(),
                if (recipientError != null)
                  Text(
                    recipientError!,
                    style: const TextStyle(color: Colors.red),
                  ),
                if (!isLoadingRecipients &&
                    recipientError == null &&
                    recipients.isEmpty)
                  const Text(
                    'Your barangay has no e-payment recipient configured. Contact the barangay hall or pay in person.',
                  ),
                if (recipients.isNotEmpty) ...[
                  DropdownButtonFormField<int>(
                    initialValue:
                        recipients.any((item) => item.id == selectedRecipientId)
                        ? selectedRecipientId
                        : null,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Payment recipient',
                      border: OutlineInputBorder(),
                    ),
                    items: recipients
                        .map(
                          (recipient) => DropdownMenuItem<int>(
                            value: recipient.id,
                            child: Text(
                              '${recipient.displayName} · ${recipient.providerLabel}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => onSelectedRecipientChanged(value),
                  ),
                  if (selectedRecipientId != null)
                    Builder(
                      builder: (context) {
                        final recipient = recipients.firstWhere(
                          (item) => item.id == selectedRecipientId,
                        );
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            '${recipient.recipientName} · ${recipient.recipientIdentifier}'
                            '${recipient.instructions.isEmpty ? '' : '\n${recipient.instructions}'}',
                            style: const TextStyle(fontSize: 12, height: 1.4),
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: referenceController,
                    maxLength: 100,
                    decoration: const InputDecoration(
                      labelText: 'Transfer reference',
                      border: OutlineInputBorder(),
                      counterText: '',
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isSubmitting || selectedRecipientId == null
                          ? null
                          : onSubmitPaymentReference,
                      child: Text(
                        isSubmitting
                            ? 'Submitting…'
                            : 'Submit transfer reference',
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}
