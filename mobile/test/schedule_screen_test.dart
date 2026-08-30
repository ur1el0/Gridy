import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/activity_schedule_model.dart';
import 'package:mobile/models/document_request_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/schedule_screen.dart';
import 'package:mobile/services/schedule_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockScheduleService extends ScheduleService {
  MockScheduleService({required StorageService storage})
      : super(
          apiClient: ApiClient(),
          storageService: storage,
        );

  @override
  Future<ScheduleData> fetchScheduleData() async {
    final now = DateTime.now();
    return ScheduleData(
      user: const UserModel(
        id: 1,
        username: 'juan_delacruz',
        email: 'juan@example.com',
        fullName: 'Juan Dela Cruz',
        role: 'RESIDENT',
      ),
      activities: [
        ActivityScheduleModel(
          id: 1,
          title: 'Mobile Health Clinic',
          description: 'Free check-ups, flu vaccines, and basic consultations for all residents.',
          eventDatetime: DateTime(now.year, now.month, now.day, 8, 0),
          location: 'Community Covered Court',
        ),
        ActivityScheduleModel(
          id: 2,
          title: 'Barangay Assembly',
          description: 'Quarterly meeting to discuss new community infrastructure projects.',
          eventDatetime: DateTime(now.year, now.month, now.day + 4, 16, 0),
          location: 'Main Hall, Brgy. Center',
        ),
      ],
      documentRequests: [
        DocumentRequestModel(
          id: 9201,
          documentType: 'Barangay Clearance',
          status: 'READY_FOR_PICKUP',
          createdAt: DateTime(now.year, now.month, now.day),
        ),
      ],
    );
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({
      'access_token': 'dummy_jwt_token',
      'user_data': '{"id": 1, "username": "juan_delacruz", "email": "juan@example.com", "full_name": "Juan Dela Cruz", "role": "RESIDENT"}',
    });
  });

  Widget createScheduleScreenTestWidget(ScheduleService service) {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      home: ScheduleScreen(
        scheduleService: service,
      ),
    );
  }

  testWidgets('ScheduleScreen renders all key UI sections matching reference design', (WidgetTester tester) async {
    final storage = await StorageService.init();
    final mockService = MockScheduleService(storage: storage);

    await tester.pumpWidget(createScheduleScreenTestWidget(mockService));
    await tester.pumpAndSettle();

    // 1. Verify Gridy Logo Header & Avatar
    expect(find.text('Gridy'), findsOneWidget);
    expect(find.text('J'), findsOneWidget); // User initial

    // 2. Verify "MY APPOINTMENTS" Section
    expect(find.text('MY APPOINTMENTS'), findsOneWidget);
    expect(find.text('CONFIRMED'), findsOneWidget);
    expect(find.text('Document Pickup'), findsOneWidget);
    expect(find.text('Barangay Clearance (ID-9201)'), findsOneWidget);

    // 3. Verify "Upcoming Events" Section
    expect(find.text('Upcoming Events'), findsOneWidget);
    expect(find.text('View All'), findsOneWidget);
    expect(find.text('Mobile Health Clinic'), findsOneWidget);
    expect(find.text('Community Covered Court'), findsOneWidget);
    expect(find.text('Add to Calendar'), findsWidgets);

    // 4. Verify Custom Bottom Navigation Bar tab selection
    expect(find.text('SCHEDULE'), findsOneWidget);
    expect(find.text('DASHBOARD'), findsOneWidget);
    expect(find.text('QUEUE'), findsOneWidget);
    expect(find.text('DOCUMENTS'), findsOneWidget);
  });

  testWidgets('Tapping Add to Calendar triggers snackbar reminder confirmation', (WidgetTester tester) async {
    final storage = await StorageService.init();
    final mockService = MockScheduleService(storage: storage);

    await tester.pumpWidget(createScheduleScreenTestWidget(mockService));
    await tester.pumpAndSettle();

    // Find the Add to Calendar button and scroll to it
    final addBtn = find.text('Add to Calendar').first;
    await tester.ensureVisible(addBtn);
    await tester.pumpAndSettle();

    await tester.tap(addBtn);
    await tester.pumpAndSettle();

    // Verify feedback message
    expect(find.textContaining('Added "Mobile Health Clinic" to device calendar'), findsOneWidget);
  });
}
