import 'package:flutter/material.dart';

import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../services/aid_request_service.dart';
import '../services/storage_service.dart';

class AidRequestsScreen extends StatefulWidget {
  final AidRequestService? aidRequestService;

  const AidRequestsScreen({super.key, this.aidRequestService});

  @override
  State<AidRequestsScreen> createState() => _AidRequestsScreenState();
}

class _AidRequestsScreenState extends State<AidRequestsScreen> {
  static const _assistanceTypes = [
    'Medical assistance',
    'Food assistance',
    'Educational assistance',
    'Emergency assistance',
    'Other barangay assistance',
  ];

  AidRequestService? _service;
  List<Map<String, dynamic>> _requests = [];
  final _reasonController = TextEditingController();
  String _assistanceType = _assistanceTypes.first;
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _initialize() async {
    _service = widget.aidRequestService;
    if (_service == null) {
      final storage = await StorageService.init();
      final apiClient = ApiClient();
      final token = storage.getAccessToken();
      if (token != null) apiClient.setAuthCredentials(accessToken: token);
      _service = AidRequestService(apiClient: apiClient);
    }
    await _loadRequests();
  }

  Future<void> _loadRequests() async {
    try {
      final requests = await _service!.fetchRequests();
      if (mounted) setState(() => _requests = requests);
    } catch (_) {
      if (mounted) _showMessage('Could not load assistance requests.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitRequest() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty || _isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      await _service!.createRequest(
        assistanceType: _assistanceType,
        reason: reason,
      );
      _reasonController.clear();
      await _loadRequests();
      if (mounted) _showMessage('Request submitted for barangay staff review.');
    } catch (_) {
      if (mounted) _showMessage('Could not submit your assistance request.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'UNDER_REVIEW':
        return 'Under review';
      case 'APPROVED':
        return 'Approved';
      case 'DECLINED':
        return 'Declined';
      default:
        return 'Pending review';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Barangay Assistance',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        foregroundColor: AppColors.textPrimary,
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadRequests,
              color: AppColors.primaryNavy,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: AppRadius.radiusLg,
                      border: Border.all(color: AppColors.borderSubtle, width: 1.0),
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Request assistance',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Barangay staff will review your request manually. Submission does not guarantee approval.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13.5,
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          initialValue: _assistanceType,
                          decoration: const InputDecoration(
                            labelText: 'Type of assistance',
                            filled: true,
                            fillColor: AppColors.inputBackground,
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(
                              borderRadius: AppRadius.radiusMd,
                              borderSide: BorderSide(color: AppColors.borderSubtle),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: AppRadius.radiusMd,
                              borderSide: BorderSide(color: AppColors.borderSubtle),
                            ),
                          ),
                          items: _assistanceTypes
                              .map(
                                (type) => DropdownMenuItem(
                                  value: type,
                                  child: Text(type),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => _assistanceType = value);
                            }
                          },
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _reasonController,
                          maxLength: 2000,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            labelText: 'Reason for request',
                            alignLabelWithHint: true,
                            filled: true,
                            fillColor: AppColors.inputBackground,
                            border: OutlineInputBorder(
                              borderRadius: AppRadius.radiusMd,
                              borderSide: BorderSide(color: AppColors.borderSubtle),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: AppRadius.radiusMd,
                              borderSide: BorderSide(color: AppColors.borderSubtle),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryNavy,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: const RoundedRectangleBorder(
                                borderRadius: AppRadius.radiusMd,
                              ),
                              elevation: 0,
                            ),
                            onPressed: _isSubmitting ? null : _submitRequest,
                            icon: _isSubmitting
                                ? const SizedBox.square(
                                    dimension: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Icon(Icons.send_outlined, size: 18),
                            label: Text(
                              _isSubmitting
                                  ? 'Submitting…'
                                  : 'Submit for review',
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Your requests',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (_requests.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppRadius.radiusMd,
                        border: Border.all(color: AppColors.borderSubtle, width: 1.0),
                      ),
                      child: const Center(
                        child: Text(
                          'No assistance requests have been submitted.',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ),
                    ),
                  ..._requests.map(
                    (request) {
                      final status = request['status']?.toString() ?? 'PENDING';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: AppRadius.radiusMd,
                          border: Border.all(color: AppColors.borderSubtle, width: 1.0),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    request['assistance_type']?.toString() ??
                                        'Assistance request',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: status == 'APPROVED'
                                        ? AppColors.surfaceSuccess
                                        : (status == 'DECLINED'
                                            ? AppColors.surfaceError
                                            : AppColors.surfaceWarning),
                                    borderRadius: AppRadius.radiusPill,
                                  ),
                                  child: Text(
                                    _statusLabel(status),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: status == 'APPROVED'
                                          ? AppColors.textSuccess
                                          : (status == 'DECLINED'
                                              ? AppColors.textError
                                              : AppColors.textWarning),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              request['reason']?.toString() ?? '',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13.5,
                              ),
                            ),
                            if ((request['staff_notes']?.toString() ?? '')
                                .isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceNavy,
                                  borderRadius: AppRadius.radiusSm,
                                ),
                                child: Text(
                                  'Staff note: ${request['staff_notes']}',
                                  style: const TextStyle(
                                    color: AppColors.primaryNavy,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
    );
  }
}
