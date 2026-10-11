import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/theme/app_colors.dart';

class PhotoUploadCard extends StatelessWidget {
  final String title;
  final XFile? selectedFile;
  final VoidCallback onPick;
  final VoidCallback onRemove;
  final bool enabled;

  const PhotoUploadCard({
    super.key,
    required this.title,
    required this.selectedFile,
    required this.onPick,
    required this.onRemove,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selectedFile != null
              ? const Color(0xFF10B981)
              : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(
            selectedFile != null
                ? Icons.check_circle_rounded
                : Icons.upload_file_rounded,
            color: selectedFile != null
                ? const Color(0xFF10B981)
                : const Color(0xFF94A3B8),
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              selectedFile != null ? selectedFile!.name : title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: selectedFile != null
                    ? FontWeight.w600
                    : FontWeight.w500,
                color: selectedFile != null
                    ? AppColors.textPrimary
                    : const Color(0xFF94A3B8),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (selectedFile != null)
            IconButton(
              tooltip: 'Remove ${selectedFile!.name}',
              icon: const Icon(
                Icons.close_rounded,
                size: 18,
                color: Color(0xFFEF4444),
              ),
              onPressed: onRemove,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            )
          else
            TextButton(
              onPressed: enabled ? onPick : null,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: const Text('SELECT'),
            ),
        ],
      ),
    );
  }
}
