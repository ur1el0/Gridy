import 'dart:io';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../core/theme/app_colors.dart';
import '../models/document_request_model.dart';
import '../services/document_service.dart';

/// Modal dialog showing complete document request lifecycle details and PDF download
class DocumentDetailsDialog extends StatefulWidget {
  final DocumentRequestModel request;
  final DocumentService? documentService;

  const DocumentDetailsDialog({
    super.key,
    required this.request,
    this.documentService,
  });

  @override
  State<DocumentDetailsDialog> createState() => _DocumentDetailsDialogState();
}

class _DocumentDetailsDialogState extends State<DocumentDetailsDialog> {
  bool _isDownloading = false;

  Future<void> _handleDownloadPdf() async {
    final documentService = widget.documentService;
    if (documentService == null || _isDownloading) return;

    setState(() => _isDownloading = true);

    try {
      final pdfBytes =
          await documentService.downloadDocumentPdf(widget.request.id);

      if (pdfBytes.isEmpty) {
        throw Exception('The server returned an empty PDF.');
      }

      final directory = await getApplicationDocumentsDirectory();
      final fileName = 'gridy_clearance_${widget.request.id}.pdf';
      final file = File('${directory.path}/$fileName');

      await file.writeAsBytes(pdfBytes, flush: true);

      final openResult = await OpenFilex.open(
        file.path,
        type: 'application/pdf',
      );

      if (openResult.type != ResultType.done) {
        throw Exception(
          'Saved as $fileName, but could not open it: ${openResult.message}',
        );
      }

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('PDF saved and opened: $fileName'),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      final message = e.toString().replaceFirst(
            RegExp(r'^Exception:\s*'),
            '',
          );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not download or open the PDF: $message'),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final req = widget.request;
    final canDownload = req.isReadyForPickup || req.isReleased;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),

          // Header with Title and Status
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Icon(
                    Icons.description_outlined,
                    color: AppColors.primaryNavy,
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      req.documentType,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      req.formattedTrackingId,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: req.statusBadgeBgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  req.statusBadgeLabel,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: req.statusBadgeTextColor,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          const Divider(color: Color(0xFFF1F5F9), height: 1),
          const SizedBox(height: 16),

          // Details List
          _DetailRow(
            label: 'Current Status',
            value: req.statusDisplay,
            valueColor: req.statusBadgeTextColor,
          ),
          const SizedBox(height: 12),
          _DetailRow(
            label: 'Urgency Priority',
            value: req.urgencyTag.toUpperCase() == 'URGENT' ? 'Urgent / Priority' : 'Regular',
          ),
          const SizedBox(height: 12),
          _DetailRow(
            label: 'Submission Date',
            value: req.formattedRequestedDate,
          ),
          
          if (req.orNumber != null && req.orNumber!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DetailRow(
              label: 'Official Receipt (O.R.)',
              value: req.orNumber!,
            ),
          ],
          if (req.formattedFee != null) ...[
            const SizedBox(height: 12),
            _DetailRow(
              label: 'Assessment Fee',
              value: req.formattedFee!,
              valueColor: const Color(0xFF0F766E),
            ),
          ],
          if (req.isWalkin) ...[
            const SizedBox(height: 12),
            const _DetailRow(
              label: 'Filing Channel',
              value: 'Barangay Hall Walk-In',
            ),
          ],

          if (req.adminNotes != null && req.adminNotes!.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'BARANGAY REMARKS / NOTES',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.textLabel,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                req.adminNotes!,
                style: const TextStyle(
                  fontSize: 12.5,
                  color: AppColors.textPrimary,
                  height: 1.4,
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Action Button if PDF can be generated or Close
          if (canDownload) ...[
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _isDownloading ? null : _handleDownloadPdf,
                icon: _isDownloading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.download_rounded, color: Colors.white, size: 20),
                label: Text(
                  _isDownloading ? 'Generating Certificate...' : 'Download Official PDF',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryNavy,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],

          SizedBox(
            width: double.infinity,
            height: 46,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Close',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12.5,
            color: AppColors.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
