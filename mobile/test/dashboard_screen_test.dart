import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/activity_schedule_model.dart';
import 'package:mobile/models/announcement_model.dart';
import 'package:mobile/models/document_request_model.dart';
import 'package:mobile/models/notification_item_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/dashboard_screen.dart';
import 'package:mobile/services/dashboard_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDashboardService extends DashboardService {
  MockDashboardService({required StorageService storage})
      : super(
          apiClient: ApiClient(),
          storageService: storage,
        );

  @override
  Future<DashboardData> fetchDashboardData() async {
    return DashboardData(
      user: const UserModel(
        id: 1,
        username: 'resident_juan',
        email: 'juan@example.com',
        role: 'RESIDENT',
        fullName: 'Juan Dela Cruz',
        isVerified: true,
      ),
      announcements: const [
        AnnouncementModel(
          id: 1,
          title: 'Vaccination Drive Reminder',
          content: 'Free vaccine at health center',
        ),
      ],
      documentRequests: const [
        DocumentRequestModel(
          id: 1,
          documentType: 'Barangay Clearance',
          status: 'PENDING',
        ),
        DocumentRequestModel(
          id: 2,
          documentType: 'Certificate of Indigency',
          status: 'PROCESSING',
        ),
      ],
      activities: [
        ActivityScheduleModel(
          id: 1,
          title: 'Vaccination Drive',
          description: 'Basic immunization',
          eventDatetime: DateTime.now(),
          location: 'Barangay Center',
        ),
      ],
      notifications: [
        NotificationItemModel(
          id: '1',
          title: 'Tax Clearance Approved',
          category: 'Document Services',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          type: NotificationType.approved,
        ),
      ],
    );
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('DashboardScreen renders all sections from reference UI correctly', (WidgetTester tester) async {
    final prefs = await SharedPreferences.getInstance();
    final storage = StorageService(prefs);
    final mockService = MockDashboardService(storage: storage);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: DashboardScreen(dashboardService: mockService),
      ),
    );

    // Initial frame
    await tester.pump();
    await tester.pumpAndSettle();

    // 1. App Bar Header & Brand
    expect(find.text('Gridy'), findsOneWidget);

    // 2. Hero Card
    expect(find.text('VERIFIED RESIDENT'), findsOneWidget);
    expect(find.text('Welcome back, Juan'), findsOneWidget);

    // 3. Metric Summary Cards
    expect(find.text('ANNOUNCEMENTS'), findsOneWidget);
    expect(find.text('MY PENDING\nREQUESTS'), findsOneWidget);

    // 4. Recent Notifications
    expect(find.text('Recent Notifications'), findsOneWidget);
    expect(find.text('View all'), findsOneWidget);
    expect(find.text('Tax Clearance Approved'), findsOneWidget);

    // 5. Quick Services Action Cards
    expect(find.text('Quick Services'), findsOneWidget);
    expect(find.text('Request Document'), findsOneWidget);
    expect(find.text('Report Issue'), findsOneWidget);
    expect(find.text('Barangay Hotline'), findsOneWidget);
    expect(find.text('My Reports'), findsOneWidget);

    // 6. Community Schedule Timeline
    expect(find.text('Community Schedule'), findsOneWidget);
    expect(find.text('Vaccination Drive'), findsOneWidget);
    expect(find.text('Barangay Center'), findsOneWidget);

    // 7. Bottom Navigation Bar Tabs
    expect(find.text('DASHBOARD'), findsOneWidget);
    expect(find.text('QUEUE'), findsOneWidget);
    expect(find.text('DOCUMENTS'), findsOneWidget);
    expect(find.text('SCHEDULE'), findsOneWidget);
  });
}
