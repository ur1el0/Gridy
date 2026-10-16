import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/theme/app_colors.dart';

/// Modal dialog displaying authenticated resident document media
class ResidentEvidenceViewerDialog extends StatefulWidget {
  final String title;
  final Future<Uint8List> Function() loadImage;

  const ResidentEvidenceViewerDialog({
    super.key,
    required this.title,
    required this.loadImage,
  });

  /// Convenience helper to display the dialog
  static Future<void> show(
    BuildContext context, {
    required String title,
    required Future<Uint8List> Function() loadImage,
  }) {
    return showDialog(
      context: context,
      builder: (ctx) => ResidentEvidenceViewerDialog(
        title: title,
        loadImage: loadImage,
      ),
    );
  }

  @override
  State<ResidentEvidenceViewerDialog> createState() =>
      _ResidentEvidenceViewerDialogState();
}

class _ResidentEvidenceViewerDialogState
    extends State<ResidentEvidenceViewerDialog> {
  late Future<Uint8List> _imageFuture;

  @override
  void initState() {
    super.initState();
    _imageFuture = widget.loadImage();
  }

  void _retry() {
    setState(() => _imageFuture = widget.loadImage());
  }

  String _failureMessage(Object error) {
    if (error is UnauthorizedException) {
      return 'Your session expired. Sign in again, then retry.';
    }
    if (error is NotFoundException) {
      return 'This document is no longer available.';
    }
    if (error is NetworkException) {
      return 'Check your connection and try again.';
    }
    if (error is ApiException && error.statusCode == 503) {
      return 'Document storage is temporarily unavailable. Try again shortly.';
    }
    return 'Unable to load document image.';
  }

  Widget _buildFailure(Object error) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.broken_image_rounded, size: 48, color: Colors.grey),
          const SizedBox(height: 8),
          Text(
            _failureMessage(error),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: _retry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
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
              widget.title,
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
              child: FutureBuilder<Uint8List>(
                future: _imageFuture,
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return _buildFailure(snapshot.error!);
                  }
                  if (!snapshot.hasData) {
                    return const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(),
                    );
                  }
                  return Image.memory(
                    snapshot.data!,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) =>
                        _buildFailure(error),
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
