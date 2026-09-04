import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/queue_ticket_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/queue_service.dart';
import '../services/storage_service.dart';
import '../widgets/custom_bottom_nav.dart';
import '../widgets/queue_hero_card.dart';
import '../widgets/queue_metric_cards.dart';
import '../widgets/recent_completions_section.dart';
import '../widgets/user_ticket_card.dart';
import 'dashboard_screen.dart';
import 'documents_screen.dart';
import 'login_screen.dart';
import 'schedule_screen.dart';

/// Screen presenting the live queue status matching the exact reference UI
class QueueScreen extends StatefulWidget {
  final QueueService? queueService;
  final AuthService? authService;

  const QueueScreen({
    super.key,
    this.queueService,
    this.authService,
  });

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  QueueService? _queueService;
  AuthService? _authService;
  UserModel? _currentUser;
  QueueLiveStatusModel _queueStatus = const QueueLiveStatusModel();
  bool _isLoading = true;
  final int _selectedNavIndex = 1;
  bool _isRequestingTicket = false;

  void _showRequestTicketModal() {
    final serviceController = TextEditingController(text: 'Document Issuance');
    final notesController = TextEditingController();
    bool isPriority = false;

    final services = [
      'Document Issuance',
      'Barangay Clearance',
      'Business Permit',
      'Tax Clearance',
      'General Inquiry',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Request Queue Ticket',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Service Type Dropdown
                  const Text('Select Service', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: serviceController.text,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                    items: services.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => serviceController.text = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Priority Checkbox (Senior/PWD/Pregnant)
                  CheckboxListTile(
                    title: const Text('Priority Lane', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Senior Citizens, PWDs, Pregnant Women'),
                    value: isPriority,
                    activeColor: const Color(0xFF0047BA),
                    contentPadding: EdgeInsets.zero,
                    onChanged: (val) {
                      setModalState(() => isPriority = val ?? false);
                    },
                  ),
                  const SizedBox(height: 12),

                  // Additional Notes
                  TextField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'Additional Notes (Optional)',
                      hintText: 'e.g. Requesting 2 copies',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0047BA),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _isRequestingTicket ? null : () async {
                        final messenger = ScaffoldMessenger.of(context);
                        Navigator.pop(context);
                        setState(() => _isRequestingTicket = true);
                        try {
                          final ticket = await _queueService!.requestTicket(
                            serviceType: serviceController.text,
                            isPriority: isPriority,
                            notes: notesController.text.isNotEmpty ? notesController.text : null,
                          );
                          if (mounted) {
                            messenger.showSnackBar( 
                              SnackBar(content: Text('Ticket ${ticket.ticketNumber} generated!')),
                            );
                            _loadQueueData();
                          }
                        } catch (e) {
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('Failed to get ticket: $e')),
                            );
                          }
                        } finally {
                          if (mounted) setState(() => _isRequestingTicket = false);
                        }
                      },
                      child: const Text('Get Ticket', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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

  @override
  void initState() {
    super.initState();
    _initializeAndLoad();
  }

  Future<void> _initializeAndLoad() async {
    _queueService = widget.queueService;
    _authService = widget.authService;

    final storage = await StorageService.init();
    _currentUser = storage.getUser();

    final apiClient = ApiClient();
    _authService ??= AuthService(
      apiClient: apiClient,
      storageService: storage,
    );
    _queueService ??= QueueService(
      apiClient: apiClient,
      storageService: storage,
    );

    await _loadQueueData();
  }

  Future<void> _loadQueueData() async {
    if (_queueService == null) return;

    try {
      final freshStatus = await _queueService!.fetchQueueStatus();
      if (mounted) {
        setState(() {
          _queueStatus = freshStatus;
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

  void _showProfileModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 28.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 20),
              CircleAvatar(
                radius: 36,
                backgroundColor: const Color(0xFFE2E8F0),
                child: Text(
                  _currentUser != null && _currentUser!.fullName.isNotEmpty
                      ? _currentUser!.fullName[0].toUpperCase()
                      : 'R',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryNavy,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _currentUser?.fullName ?? 'Resident',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _currentUser?.email ?? '',
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),
              ListTile(
                leading: const Icon(Icons.logout_rounded, color: AppColors.error),
                title: const Text(
                  'Log Out',
                  style: TextStyle(
                    color: AppColors.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: () async {
                  final navigator = Navigator.of(context);
                  Navigator.pop(ctx);
                  await _authService?.logout();
                  if (!mounted) return;
                  navigator.pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _currentUser;

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
                // Gridy Brand Logo + Text
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
                  onTap: () => _showProfileModal(context),
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
                                : 'R'),
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
              onRefresh: _loadQueueData,
              color: AppColors.primaryNavy,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section Subtitle & Title Header
                    const Text(
                      'LIVE QUEUE STATUS',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Today's Queue",
                      style: TextStyle(
                        color: Color(0xFF0A2540),
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 1. Hero Card: Currently at Counter
                    QueueHeroCard(
                      currentTicket: _queueStatus.currentTicket,
                      serviceType: _queueStatus.currentService,
                    ),

                    const SizedBox(height: 18),

                    // 2. User's Active Ticket Card
                    UserTicketCard(
                      ticket: _queueStatus.userTicket,
                    ),

                    const SizedBox(height: 18),

                    // 3. Side-by-Side Metric Cards: Estimated Call & Live Capacity
                    QueueMetricCards(
                      estimatedCallTime: _queueStatus.estimatedCallTimeFormatted,
                      liveCapacity: _queueStatus.capacityLabel,
                    ),

                    const SizedBox(height: 28),

                    // 4. Recent Completions List
                    RecentCompletionsSection(
                      completedTickets: _queueStatus.recentCompleted,
                      onViewAll: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Viewing complete queue history'),
                            behavior: SnackBarBehavior.floating,
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
          if (index == 0) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const DashboardScreen()),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showRequestTicketModal,
        backgroundColor: const Color(0xFF0047BA),
        icon: const Icon(Icons.confirmation_number_outlined, color: Colors.white),
        label: const Text('Get Ticket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      )
    );
  }
}
