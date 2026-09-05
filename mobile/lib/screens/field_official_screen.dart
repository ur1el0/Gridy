import 'package:flutter/material.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/document_request_model.dart';
import '../models/user_model.dart';
import '../services/field_official_service.dart';
import '../services/issue_service.dart';
import '../services/storage_service.dart';

class FieldOfficialScreen extends StatefulWidget {
  final FieldOfficialService? fieldOfficialService;

  const FieldOfficialScreen({
    super.key,
    this.fieldOfficialService,
  });

  @override
  State<FieldOfficialScreen> createState() => _FieldOfficialScreenState();
}

class _FieldOfficialScreenState extends State<FieldOfficialScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  FieldOfficialService? _service;
  UserModel? _currentUser;
  bool _isLoading = true;

  // Queue State
  String? _currentTicket;
  int _totalWaiting = 0;
  bool _isCallingTicket = false;

  // Clearance Validation State
  final TextEditingController _trackingIdController = TextEditingController();
  DocumentRequestModel? _verifiedClearance;
  bool _isVerifying = false;
  String? _verificationError;

  // Incident Reports State
  List<IssueReport> _reports = [];
  bool _isLoadingReports = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _initializeService();
  }

  Future<void> _initializeService() async {
    _service = widget.fieldOfficialService;
    final storage = await StorageService.init();
    _currentUser = storage.getUser();

    if (_service == null) {
      final apiClient = ApiClient();
      final token = storage.getAccessToken();
      if (token != null) {
        apiClient.setAuthCredentials(accessToken: token);
      }
      _service = FieldOfficialService(
        apiClient: apiClient,
        storageService: storage,
      );
    }

    await Future.wait([
      _loadQueueStatus(),
      _loadBarangayReports(),
    ]);

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadQueueStatus() async {
    if (_service == null) return;
    try {
      final data = await _service!.fetchLiveQueueStatus();
      if (mounted) {
        setState(() {
          _currentTicket = data['current_ticket'] as String?;
          _totalWaiting = data['total_waiting'] as int? ?? 0;
        });
      }
    } catch (_) {}
  }

  Future<void> _callNextTicket() async {
    if (_service == null || _isCallingTicket) return;
    setState(() => _isCallingTicket = true);

    try {
      final result = await _service!.callNextTicket();
      if (mounted) {
        setState(() {
          _currentTicket = result['current_ticket'] as String?;
          _totalWaiting = result['remaining_waiting'] as int? ?? 0;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Now serving: $_currentTicket'),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isCallingTicket = false);
    }
  }

  Future<void> _verifyClearance() async {
    final text = _trackingIdController.text.trim();
    if (text.isEmpty || _service == null) return;

    // Support extracting numeric ID from formats like "REQ-12" or "12"
    final cleanIdStr = text.replaceAll(RegExp(r'[^0-9]'), '');
    final docId = int.tryParse(cleanIdStr);

    if (docId == null) {
      setState(() {
        _verificationError = 'Please enter a valid numeric ID or tracking number (e.g., REQ-12).';
        _verifiedClearance = null;
      });
      return;
    }

    setState(() {
      _isVerifying = true;
      _verificationError = null;
      _verifiedClearance = null;
    });

    try {
      final result = await _service!.verifyClearance(docId);
      if (mounted) {
        setState(() {
          _verifiedClearance = result;
          if (result == null) {
            _verificationError = 'No clearance found matching ID #$docId.';
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _verificationError = 'Network error verifying clearance.');
      }
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _loadBarangayReports() async {
    if (_service == null) return;
    setState(() => _isLoadingReports = true);
    try {
      final items = await _service!.fetchBarangayIssues();
      if (mounted) {
        setState(() {
          _reports = items;
          _isLoadingReports = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingReports = false);
    }
  }

  Future<void> _updateReportStatus(int reportId, String newStatus) async {
    if (_service == null) return;
    try {
      await _service!.updateIssueStatus(reportId: reportId, status: newStatus);
      await _loadBarangayReports();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Report #$reportId updated to $newStatus'),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update report status.'),
            backgroundColor: Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _trackingIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF091B35),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Field Operations',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
            ),
            Text(
              _currentUser?.roleDisplay ?? 'Barangay Official',
              style: const TextStyle(fontSize: 12, color: Color(0xFF38BDF8), fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.swap_horiz_rounded, color: Colors.white, size: 18),
            label: const Text(
              'Resident View',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF38BDF8),
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: const [
            Tab(icon: Icon(Icons.confirmation_number_outlined), text: 'Queue Ticker'),
            Tab(icon: Icon(Icons.qr_code_scanner_rounded), text: 'Verify Clearance'),
            Tab(icon: Icon(Icons.assignment_late_outlined), text: 'Field Reports'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy)))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildQueueTickerTab(),
                _buildClearanceValidatorTab(),
                _buildFieldReportsTab(),
              ],
            ),
    );
  }

  Widget _buildQueueTickerTab() {
    return RefreshIndicator(
      onRefresh: _loadQueueStatus,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'CURRENTLY SERVING',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _currentTicket ?? '--',
                    style: const TextStyle(
                      fontSize: 54,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primaryNavy,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      'Waiting in queue: $_totalWaiting',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF475569), fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: _isCallingTicket ? null : _callNextTicket,
                icon: _isCallingTicket
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.arrow_forward_rounded, color: Colors.white),
                label: Text(
                  _isCallingTicket ? 'Calling next...' : 'Call Next Ticket',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryNavy,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClearanceValidatorTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Clearance Authenticity Validator',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 6),
          const Text(
            'Enter the Document Tracking ID printed on the resident certificate to verify validity.',
            style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _trackingIdController,
                  decoration: InputDecoration(
                    hintText: 'e.g. 12 or REQ-12',
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                  ),
                  keyboardType: TextInputType.text,
                  onSubmitted: (_) => _verifyClearance(),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _isVerifying ? null : _verifyClearance,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryNavy,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isVerifying
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Verify', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (_verificationError != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Text(
                _verificationError!,
                style: const TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w600, fontSize: 13.5),
              ),
            ),
          if (_verifiedClearance != null) _buildClearanceCard(_verifiedClearance!),
        ],
      ),
    );
  }

  Widget _buildClearanceCard(DocumentRequestModel doc) {
    final bool isValid = doc.isReadyForPickup || doc.isReleased;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isValid ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isValid ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      isValid ? Icons.verified_rounded : Icons.pending_actions_rounded,
                      size: 16,
                      color: isValid ? const Color(0xFF059669) : const Color(0xFFD97706),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isValid ? 'VALID & AUTHENTIC' : 'PENDING APPROVAL',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: isValid ? const Color(0xFF059669) : const Color(0xFFD97706),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                doc.formattedTrackingId,
                style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            doc.documentType,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primaryNavy),
          ),
          if (doc.purpose != null && doc.purpose!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Purpose: ${doc.purpose}',
              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Status: ${doc.statusDisplay}',
            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
          Text(
            'Requested Date: ${doc.formattedRequestedDate}',
            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldReportsTab() {
    if (_isLoadingReports) {
      return const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy)));
    }

    if (_reports.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadBarangayReports,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(32),
          child: SizedBox(
            width: double.infinity,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                Icon(Icons.check_circle_outline_rounded, size: 48, color: Colors.green.shade400),
                const SizedBox(height: 12),
                const Text(
                  'No active community issues',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 6),
                const Text(
                  'All citizen reports in your barangay are resolved.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBarangayReports,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _reports.length,
        separatorBuilder: (_, _) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          final report = _reports[index];
          final bool isResolved = report.status.toUpperCase() == 'RESOLVED';

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
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
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isResolved ? const Color(0xFFECFDF5) : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        report.status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: isResolved ? const Color(0xFF059669) : const Color(0xFFD97706),
                        ),
                      ),
                    ),
                    Text(
                      report.category,
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  report.title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  report.description,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppColors.accentBlue),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        report.location,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (!isResolved) ...[
                      OutlinedButton(
                        onPressed: () => _updateReportStatus(report.id, 'IN_PROGRESS'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('In-Progress', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () => _updateReportStatus(report.id, 'RESOLVED'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Resolve', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}