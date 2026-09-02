import 'hotlines_screen.dart';
import 'report_issue_screen.dart';
import '../services/push_notification_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/user_model.dart';
import '../models/notification_item_model.dart';
import '../services/auth_service.dart';
import '../services/dashboard_service.dart';
import '../widgets/community_schedule_section.dart';
import '../widgets/custom_bottom_nav.dart';
import '../widgets/metric_summary_card.dart';
import '../widgets/quick_services_section.dart';
import '../widgets/recent_notifications_section.dart';
import '../widgets/resident_hero_card.dart';
import 'documents_screen.dart';
import 'login_screen.dart';
import 'queue_screen.dart';
import 'schedule_screen.dart';
import '../services/storage_service.dart';
import 'profile_screen.dart';


class DashboardScreen extends StatefulWidget {
  final DashboardService? dashboardService;
  final AuthService? authService;

  const DashboardScreen({
    super.key,
    this.dashboardService,
    this.authService,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardService? _dashboardService;
  AuthService? _authService;
  DashboardData _data = const DashboardData();
  bool _isLoading = true;
  final int _selectedNavIndex = 0;

  @override
  void initState() {
    super.initState();
    _initializeAndLoad();
  }

    Future<void> _initializeAndLoad() async {
    _dashboardService = widget.dashboardService;
    _authService = widget.authService;

    // Initialize core services
    final storage = await StorageService.init();
    final apiClient = ApiClient();
    
    // Ensure the token is attached so backend calls succeed after an app restart
    final token = storage.getAccessToken();
    if (token != null) {
      apiClient.setAuthCredentials(accessToken: token);
    }

    if (_dashboardService == null || _authService == null) {
      _authService ??= AuthService(
        apiClient: apiClient,
        storageService: storage,
      );
      _dashboardService ??= DashboardService(
        apiClient: apiClient,
        storageService: storage,
      );
    }

    // FIREBASE: Request permissions & register device token
    final pushService = PushNotificationService(apiClient: apiClient);
    pushService.initialize();

    await _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    if (_dashboardService == null) return;

    try {
      final freshData = await _dashboardService!.fetchDashboardData();
      if (mounted) {
        setState(() {
          _data = freshData;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final UserModel? user = _data.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Brand Logo & Title Header
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFF091B35),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.all(7),
                      child: SvgPicture.asset(
                        'assets/images/MainLogo.svg',
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Gridy',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primaryNavy,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),

                // Right Profile Avatar Circle
                GestureDetector(
                  onTap: () {
                    if (_data.user != null && _authService != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProfileScreen(
                            user: _data.user!,
                            authService: _authService!,
                          ),
                        ),
                      );
                    }
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFCBD5E1),
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        user != null && user.fullName.isNotEmpty
                            ? user.fullName[0].toUpperCase()
                            : (user != null && user.username.isNotEmpty
                                ? user.username[0].toUpperCase()
                                : 'C'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryNavy,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              color: AppColors.primaryNavy,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Verified Resident Hero Banner Card
                    ResidentHeroCard(
                      user: _data.user,
                      pendingCount: _data.pendingRequestsCount,
                    ),

                    const SizedBox(height: 18),

                    // 2. Metric Counters Row (Announcements & Pending Requests)
                    MetricSummaryRow(
                      announcementCount: _data.announcements.length,
                      pendingRequestCount: _data.pendingRequestsCount,
                      hasNewAnnouncements: _data.announcements.isNotEmpty,
                    ),

                    const SizedBox(height: 24),

                    // 3. Recent Notifications Section
                    RecentNotificationsSection(
                      notifications: _data.notifications,
                      onViewAll: () => _showNotificationModalSheet(context),
                    ),

                    const SizedBox(height: 24),

                    // 4. Quick Services Action Cards
                    QuickServicesSection(
                      onRequestDocument: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const DocumentsScreen(),
                          ),
                        );
                      },
                      onReportIssue: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ReportIssueScreen()),
                        );
                      },
                      onBarangayHotline: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => HotlinesScreen(),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 24),

                    // 5. Community Schedule Timeline
                    CommunityScheduleSection(
                      activities: _data.activities,
                      onActivityTap: (activity) {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: Text(activity.title),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Location: ${activity.location}',
                                    style: const TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Text(activity.description.isNotEmpty
                                    ? activity.description
                                    : 'No additional details provided.'),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('OK'),
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _selectedNavIndex,
        onTap: (index) {
          if (index == 1) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const QueueScreen()),
            );
          } else if (index == 2) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const DocumentsScreen()),
            );
          } else if (index == 3) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const ScheduleScreen()),
            );
          }
        },
      ),
    );
  }

  void _showNotificationModalSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final notifications = _data.notifications;
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.85,
          expand: false,
          builder: (context, scrollController) {
            return Container(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Notification Center',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryNavy.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${notifications.length} Active',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primaryNavy,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: notifications.isEmpty
                        ? const Center(
                            child: Text(
                              'No recent notifications',
                              style: TextStyle(color: AppColors.textMuted),
                            ),
                          )
                        : ListView.separated(
                            controller: scrollController,
                            itemCount: notifications.length,
                            separatorBuilder: (_, _) => const Divider(height: 20),
                            itemBuilder: (context, index) {
                              final item = notifications[index];
                              return Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: item.type == NotificationType.approved
                                          ? const Color(0xFFDCFCE7)
                                          : const Color(0xFFFEF3C7),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      item.type == NotificationType.approved
                                          ? Icons.check_circle_rounded
                                          : Icons.info_rounded,
                                      color: item.type == NotificationType.approved
                                          ? const Color(0xFF15803D)
                                          : const Color(0xFFB45309),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.title,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          item.category,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
