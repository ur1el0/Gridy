import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

void showPrivacyPolicySheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetHandle(),
          const SizedBox(height: 20),
          const Text(
            'Privacy Policy & Data Protection',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'KapitBayan Resident Portal is committed to protecting your personal information. '
            'All data submitted during login, registration, document requests, and queue ticketing '
            'is encrypted and processed in full compliance with the Republic Act No. 10173 (Data Privacy Act of 2012).\n\n'
            'Your citizen ID, contact information, and request logs are accessible strictly by authorized Barangay Officials.',
            style: TextStyle(
              fontSize: 13.5,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          _CloseButton(onPressed: () => Navigator.pop(context)),
        ],
      ),
    ),
  );
}

void showSupportSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetHandle(),
          const SizedBox(height: 20),
          const Text(
            'Barangay Resident Support',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          const _SupportDetail(
            icon: Icons.phone_rounded,
            text: '(02) 8920-0000 / Hotline 161',
          ),
          const SizedBox(height: 12),
          const _SupportDetail(
            icon: Icons.email_rounded,
            text: 'support@gridy.gov.ph',
          ),
          const SizedBox(height: 12),
          const _SupportDetail(
            icon: Icons.access_time_filled_rounded,
            text: 'Mon - Fri: 8:00 AM - 5:00 PM',
          ),
          const SizedBox(height: 24),
          _CloseButton(onPressed: () => Navigator.pop(context)),
        ],
      ),
    ),
  );
}

class _SheetHandle extends StatelessWidget {
  const _SheetHandle();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }
}

class _CloseButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _CloseButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryNavy,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('Close', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}

class _SupportDetail extends StatelessWidget {
  final IconData icon;
  final String text;

  const _SupportDetail({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primaryNavy, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
