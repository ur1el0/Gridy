import 'package:flutter/material.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/activity_schedule_model.dart';
import '../models/document_request_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/schedule_service.dart';
import '../services/storage_service.dart';
import '../widgets/appointment_schedule_card.dart';
import '../widgets/calendar_day_strip.dart';
import '../widgets/custom_bottom_nav.dart';
import '../widgets/schedule_event_card.dart';
import '../widgets/schedule_detail_dialogs.dart';
import 'dashboard_screen.dart';
import 'documents_screen.dart';
import 'queue_screen.dart';
import 'profile_screen.dart';

/// Community & Appointments Schedule Screen matching the exact reference UI
class ScheduleScreen extends StatefulWidget {
  final ScheduleService? scheduleService;
  final AuthService? authService;

  const ScheduleScreen({super.key, this.scheduleService, this.authService});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  ScheduleService? _scheduleService;
  AuthService? _authService;
  ScheduleData _data = const ScheduleData();
  DateTime _selectedDate = DateTime.now();
  bool _isLoading = true;
  bool _showAllEvents = false;
  final int _selectedNavIndex = 3;

  @override
  void initState() {
    super.initState();
    _initializeAndLoad();
  }

  Future<void> _initializeAndLoad() async {
    _scheduleService = widget.scheduleService;
    _authService = widget.authService;

    if (_scheduleService == null || _authService == null) {
      final storage = await StorageService.init();
      final apiClient = ApiClient();
      _authService ??= AuthService(
        apiClient: apiClient,
        storageService: storage,
      );
      _scheduleService ??= ScheduleService(
        apiClient: apiClient,
        storageService: storage,
      );
    }

    await _loadScheduleData();
  }

  Future<void> _loadScheduleData() async {
    if (_scheduleService == null) return;

    try {
      final freshData = await _scheduleService!.fetchScheduleData();
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

  void _navigateToProfile() {
    final user = _data.user;
    if (user == null || _authService == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileScreen(user: user, authService: _authService!),
      ),
    );
  }

  void _onAddToCalendar(ActivityScheduleModel activity) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.check_circle_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Added "${activity.title}" to device calendar reminder',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.primaryNavy,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showEventDetails(ActivityScheduleModel activity) {
    showDialog(
      context: context,
      builder: (_) => ActivityDetailsDialog(
        activity: activity,
        onAddToCalendar: () => _onAddToCalendar(activity),
      ),
    );
  }

  void _showAppointmentDetails(DocumentRequestModel request) {
    showDialog(
      context: context,
      builder: (_) => AppointmentDetailsDialog(request: request),
    );
  }

  @override
  Widget build(BuildContext context) {
    final UserModel? user = _data.user;

    // Filter appointments for selected date or active requests
    final appointments = _data.getAppointmentsForDate(_selectedDate);

    // Filter upcoming events or show all based on toggle
    final filteredActivities = _data.getActivitiesForDate(_selectedDate);
    final displayedActivities = _showAllEvents || filteredActivities.isEmpty
        ? _data.activities
        : filteredActivities;

    // Event dates for calendar dot indicators
    final eventDates = _data.activities.map((a) => a.eventDatetime).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 20.0,
              vertical: 8.0,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Brand Logo & Title Header
                Row(
                  children: [
                    Image.asset(
                      'assets/images/kapitbayan_symbol.png',
                      width: 38,
                      height: 38,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'KapitBayan',
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
                  onTap: _navigateToProfile,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF94A3B8),
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
                          fontWeight: FontWeight.w800,
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
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.primaryNavy,
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadScheduleData,
              color: AppColors.primaryNavy,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20.0,
                  vertical: 12.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Calendar Day Strip Header
                    CalendarDayStrip(
                      selectedDate: _selectedDate,
                      eventDates: eventDates,
                      onDateSelected: (date) {
                        setState(() {
                          _selectedDate = date;
                          _showAllEvents = false;
                        });
                      },
                    ),

                    const SizedBox(height: 24),

                    // 2. "MY APPOINTMENTS" Section
                    const Text(
                      'MY APPOINTMENTS',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF64748B),
                        letterSpacing: 1.0,
                      ),
                    ),

                    const SizedBox(height: 12),

                    if (appointments.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          vertical: 24,
                          horizontal: 16,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(0xFFF1F5F9),
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.event_busy_rounded,
                              size: 32,
                              color: const Color(
                                0xFF94A3B8,
                              ).withValues(alpha: 0.8),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'No appointments scheduled for this date',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: appointments.length > 2
                            ? 2
                            : appointments.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final req = appointments[index];
                          return AppointmentScheduleCard(
                            request: req,
                            onTap: () => _showAppointmentDetails(req),
                          );
                        },
                      ),

                    const SizedBox(height: 26),

                    // 3. "Upcoming Events" Section Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Upcoming Events',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.3,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _showAllEvents = !_showAllEvents;
                            });
                          },
                          child: Text(
                            _showAllEvents ? 'Show Date' : 'View All',
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryNavy,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Upcoming Events List
                    if (displayedActivities.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          vertical: 28,
                          horizontal: 16,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(0xFFE2E8F0),
                            width: 1.0,
                          ),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.calendar_today_outlined,
                              size: 32,
                              color: Color(0xFF94A3B8),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'No community events scheduled',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _showAllEvents = true;
                                });
                              },
                              child: const Text('View All Activities'),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: displayedActivities.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          final activity = displayedActivities[index];
                          return ScheduleEventCard(
                            activity: activity,
                            onAddToCalendar: () => _onAddToCalendar(activity),
                            onTap: () => _showEventDetails(activity),
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
          if (index == 0) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const DashboardScreen()),
            );
          } else if (index == 1) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const QueueScreen()),
            );
          } else if (index == 2) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const DocumentsScreen()),
            );
          }
        },
      ),
    );
  }
}
