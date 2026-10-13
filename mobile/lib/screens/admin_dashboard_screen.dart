import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../models/user_model.dart';
import '../services/storage_service.dart';
import 'dashboard_screen.dart';
import 'field_official_screen.dart';
import 'login_screen.dart';
import 'queue_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  final ApiClient? apiClient;

  const AdminDashboardScreen({super.key, this.apiClient});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  UserModel? _currentUser;
  bool _isLoading = true;

  // Executive Metrics from /dashboard/summary/
  int _totalResidents = 0;
  int _pendingDocuments = 0;
  int _waitingQueue = 0;
  String? _servingNow;
  int _pendingIssues = 0;

  @override
  void initState() {
    super.initState();
    _loadExecutiveDashboard();
  }

  Future<void> _loadExecutiveDashboard() async {
    final storage = await StorageService.init();
    _currentUser = storage.getUser();

    final apiClient = widget.apiClient ?? ApiClient();
    final token = storage.getAccessToken();
    if (token != null) {
      apiClient.setAuthCredentials(accessToken: token);
    }

    try {
      final response = await apiClient.get('/dashboard/summary/', requiresAuth: true);
      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        setState(() {
          _totalResidents = data['total_residents'] as int? ?? 0;
          
          final docs = data['document_requests'] as Map<String, dynamic>?;
          _pendingDocuments = docs?['pending'] as int? ?? 0;

          final queue = data['queue_activity'] as Map<String, dynamic>?;
          _waitingQueue = queue?['waiting_in_queue'] as int? ?? 0;
          _servingNow = queue?['serving_now'] as String?;

          final issues = data['issue_reports'] as Map<String, dynamic>?;
          _pendingIssues = issues?['pending'] as int? ?? 0;
          
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    if (mounted) setState(() => _isLoading = false);
  }

  void _handleLogout() async {
    final storage = await StorageService.init();
    await storage.clearAll();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primaryNavy,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Executive Console',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
            ),
            Text(
              _currentUser?.fullName.isNotEmpty == true ? _currentUser!.fullName : 'Barangay Captain',
              style: const TextStyle(fontSize: 12, color: AppColors.cyanAccent, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.white),
            tooltip: 'Logout',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy)))
          : RefreshIndicator(
              onRefresh: _loadExecutiveDashboard,
              color: AppColors.primaryNavy,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Persona Switcher Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppRadius.radiusMd,
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.admin_panel_settings_rounded, color: AppColors.primaryNavy, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Executive Mode Active',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const DashboardScreen()),
                              );
                            },
                            child: const Text('Resident View', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Executive Metric Cards (Aligned with Web Admin)
                    const Text(
                      'OVERVIEW METRICS',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textSecondary, letterSpacing: 1.1),
                    ),
                    const SizedBox(height: 12),

                    GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _buildMetricCard(
                          title: 'Total Residents',
                          value: '$_totalResidents',
                          icon: Icons.people_alt_outlined,
                          iconColor: const Color(0xFF0284C7),
                          bgColor: AppColors.surfaceCyan,
                        ),
                        _buildMetricCard(
                          title: 'Pending Docs',
                          value: '$_pendingDocuments',
                          icon: Icons.assignment_outlined,
                          iconColor: const Color(0xFFF59E0B),
                          bgColor: AppColors.surfaceWarning,
                        ),
                        _buildMetricCard(
                          title: 'Waiting Queue',
                          value: '$_waitingQueue',
                          subtitle: _servingNow != null ? 'Serving: $_servingNow' : null,
                          icon: Icons.confirmation_number_outlined,
                          iconColor: AppColors.success,
                          bgColor: AppColors.surfaceSuccess,
                        ),
                        _buildMetricCard(
                          title: 'Active Reports',
                          value: '$_pendingIssues',
                          icon: Icons.warning_amber_rounded,
                          iconColor: AppColors.error,
                          bgColor: AppColors.surfaceError,
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Executive Management Actions
                    const Text(
                      'EXECUTIVE OPERATIONS',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textSecondary, letterSpacing: 1.1),
                    ),
                    const SizedBox(height: 12),

                    _buildActionTile(
                      icon: Icons.shield_rounded,
                      iconBg: AppColors.primaryNavy,
                      title: 'Field Operations Desk',
                      subtitle: 'Advance queue ticker, verify clearance QR, triage incidents',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const FieldOfficialScreen()),
                        );
                      },
                    ),

                    const SizedBox(height: 10),

                    _buildActionTile(
                      icon: Icons.confirmation_number_rounded,
                      iconBg: const Color(0xFF0284C7),
                      title: 'Live Queue Desk',
                      subtitle: 'Monitor tickets, manage priority lane',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const QueueScreen()),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.radiusMd,
        border: Border.all(color: AppColors.borderSubtle),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bgColor, borderRadius: AppRadius.radiusSm),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: iconColor),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required Color iconBg,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.radiusMd,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.radiusMd,
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: iconBg, borderRadius: AppRadius.radiusSm),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
