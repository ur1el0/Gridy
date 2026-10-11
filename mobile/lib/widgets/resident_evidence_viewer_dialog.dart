import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

/// Modal dialog displaying authenticated resident document media
class ResidentEvidenceViewerDialog extends StatelessWidget {
  final String title;
  final String mediaUrl;
  final String? token;

  const ResidentEvidenceViewerDialog({
    super.key,
    required this.title,
    required this.mediaUrl,
    this.token,
  });

  /// Convenience helper to display the dialog
  static Future<void> show(
    BuildContext context, {
    required String title,
    required String mediaUrl,
    String? token,
  }) {
    return showDialog(
      context: context,
      builder: (ctx) => ResidentEvidenceViewerDialog(
        title: title,
        mediaUrl: mediaUrl,
        token: token,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppBar(
            title: Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            backgroundColor: AppColors.primaryNavy,
            foregroundColor: Colors.white,
            automaticallyImplyLeading: false,
            actions: [
              IconButton(
                icon: const Icon(Icons.close_rounded),
                tooltip: 'Close',
                constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          Container(
            constraints: const BoxConstraints(maxHeight: 400),
            color: Colors.black12,
            child: Center(
              child: Image.network(
                mediaUrl,
                headers: token != null ? {'Authorization': 'Bearer $token'} : null,
                fit: BoxFit.contain,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return const Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.broken_image_rounded, size: 48, color: Colors.grey),
                        SizedBox(height: 8),
                        Text(
                          'Unable to load document image.',
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
