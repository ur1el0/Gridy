import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/queue_ticket_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/queue_screen.dart';
import 'package:mobile/services/queue_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockQueueService extends QueueService {
  MockQueueService({required StorageService storage})
      : super(
          apiClient: ApiClient(),
          storageService: storage,
        );

  @override
  Future<QueueLiveStatusModel> fetchQueueStatus() async {
    final now = DateTime.now();
    return QueueLiveStatusModel(
      currentTicket: 'A-124',
      currentService: 'Document Issuance',
      totalWaiting: 4,
      avgWaitMins: 8,
      userTicket: const QueueTicketModel(
        id: 132,
        ticketNumber: 'A-132',
        serviceType: 'Document Issuance',
        status: 'WAITING',
      ),
      recentCompleted: [
        QueueTicketModel(
          id: 123,
          ticketNumber: 'A-123',
          serviceType: 'Business Permit',
          status: 'COMPLETED',
          updatedAt: now.subtract(const Duration(minutes: 2)),
        ),
        QueueTicketModel(
          id: 98,
          ticketNumber: 'C-098',
          serviceType: 'Tax Clearance',
          status: 'COMPLETED',
          updatedAt: now.subtract(const Duration(minutes: 8)),
        ),
        QueueTicketModel(
          id: 122,
          ticketNumber: 'A-122',
          serviceType: 'ID Verification',
          status: 'COMPLETED',
          updatedAt: now.subtract(const Duration(minutes: 15)),
        ),
      ],
    );
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('QueueScreen renders all queue widgets matching reference UI accurately', (WidgetTester tester) async {
    final prefs = await SharedPreferences.getInstance();
    final storage = StorageService(prefs);
    await storage.saveUser(const UserModel(
      id: 1,
      username: 'resident_test',
      email: 'resident@example.com',
      role: 'RESIDENT',
      fullName: 'Juan Dela Cruz',
      isVerified: true,
    ));

    final mockQueueService = MockQueueService(storage: storage);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: QueueScreen(queueService: mockQueueService),
      ),
    );

    // Let async initialization settle
    await tester.pump();
    await tester.pumpAndSettle();

    // 1. Header & Brand Title
    expect(find.text('Gridy'), findsOneWidget);
    expect(find.text('LIVE QUEUE STATUS'), findsOneWidget);
    expect(find.text("Today's Queue"), findsOneWidget);

    // 2. Currently At Counter Hero Card
    expect(find.text('CURRENTLY AT COUNTER'), findsOneWidget);
    expect(find.text('A-124'), findsOneWidget);
    expect(find.text('Document Issuance'), findsWidgets);
    expect(find.text('Barangay Office'), findsOneWidget);

    // 3. Your Active Ticket Card
    expect(find.text('YOUR TICKET'), findsOneWidget);
    expect(find.text('A-132'), findsOneWidget);

    // 4. Live Metric Cards
    expect(find.text('ESTIMATED CALL'), findsOneWidget);
    expect(find.text('LIVE CAPACITY'), findsOneWidget);
    expect(find.text('Optimal'), findsOneWidget);

    // 5. Recent Completions Section
    expect(find.text('Recent Completions'), findsOneWidget);
    expect(find.text('VIEW ALL'), findsOneWidget);
    expect(find.text('A-123'), findsOneWidget);
    expect(find.text('Business Permit'), findsOneWidget);
    expect(find.text('C-098'), findsOneWidget);
    expect(find.text('Tax Clearance'), findsOneWidget);
    expect(find.text('A-122'), findsOneWidget);
    expect(find.text('ID Verification'), findsOneWidget);

    // 6. Custom Bottom Navigation Bar Tabs
    expect(find.text('DASHBOARD'), findsOneWidget);
    expect(find.text('QUEUE'), findsOneWidget);
    expect(find.text('DOCUMENTS'), findsOneWidget);
    expect(find.text('SCHEDULE'), findsOneWidget);
  });
}
