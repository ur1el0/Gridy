import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/document_request_model.dart';
import 'package:mobile/screens/field_official_screen.dart';
import 'package:mobile/services/field_official_service.dart';
import 'package:mobile/services/issue_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockFieldOfficialService extends FieldOfficialService {
  MockFieldOfficialService({required StorageService storage})
      : super(
          apiClient: ApiClient(),
          storageService: storage,
        );

  @override
  Future<Map<String, dynamic>> fetchLiveQueueStatus() async {
    return {
      'current_ticket': 'T003',
      'total_waiting': 5,
    };
  }

  @override
  Future<Map<String, dynamic>> callNextTicket() async {
    return {
      'current_ticket': 'T004',
      'remaining_waiting': 4,
    };
  }

  @override
  Future<DocumentRequestModel?> verifyClearance(int documentId) async {
    return DocumentRequestModel(
      id: documentId,
      documentType: 'Barangay Clearance',
      status: 'READY_FOR_PICKUP',
      purpose: 'Local Employment Verification',
      createdAt: DateTime(2026, 9, 1),
    );
  }

  @override
  Future<List<IssueReport>> fetchBarangayIssues() async {
    return [
      IssueReport(
        id: 101,
        title: 'Clogged Drainage on Purok 4',
        description: 'Heavy rain causes overflow into residential walkways.',
        location: 'Near Purok 4 Chapel',
        status: 'PENDING',
        category: 'ENVIRONMENT',
        urgency: 'HAZARD',
        createdAt: '2026-09-02T10:00:00Z',
      ),
    ];
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({
      'access_token': 'dummy_official_jwt_token',
      'user_data':
          '{"id": 2, "username": "official_tanod", "email": "tanod@barangay.gov", "full_name": "Chief Tanod Juan", "role": "FIELD_OFFICIAL"}',
    });
  });

  Widget createFieldOfficialScreenTestWidget(FieldOfficialService service) {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      home: FieldOfficialScreen(
        fieldOfficialService: service,
      ),
    );
  }

  testWidgets('FieldOfficialScreen renders all 3 field tabs and interacts with queue & clearance validator',
      (WidgetTester tester) async {
    final storage = await StorageService.init();
    final mockService = MockFieldOfficialService(storage: storage);

    await tester.pumpWidget(createFieldOfficialScreenTestWidget(mockService));
    await tester.pumpAndSettle();

    // 1. Verify Top Bar & Role Badge
    expect(find.text('Field Operations'), findsOneWidget);
    expect(find.text('Resident View'), findsOneWidget);
    expect(find.text('Queue Ticker'), findsOneWidget);
    expect(find.text('Verify Clearance'), findsOneWidget);
    expect(find.text('Field Reports'), findsOneWidget);

    // 2. Verify Tab 1 (Queue Ticker) initial state
    expect(find.text('CURRENTLY SERVING'), findsOneWidget);
    expect(find.text('T003'), findsOneWidget);
    expect(find.text('Waiting in queue: 5'), findsOneWidget);
    expect(find.text('Call Next Ticket'), findsOneWidget);

    // Test calling the next ticket
    await tester.tap(find.text('Call Next Ticket'));
    await tester.pumpAndSettle();
    expect(find.text('T004'), findsOneWidget);
    expect(find.text('Waiting in queue: 4'), findsOneWidget);

    // 3. Switch to Tab 2 (Verify Clearance)
    await tester.tap(find.text('Verify Clearance'));
    await tester.pumpAndSettle();

    expect(find.text('Clearance Authenticity Validator'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);

    // Enter tracking ID and tap Verify
    await tester.enterText(find.byType(TextField), 'REQ-15');
    await tester.tap(find.text('Verify'));
    await tester.pumpAndSettle();

    // Verify Clearance Card Details
    expect(find.text('VALID & AUTHENTIC'), findsOneWidget);
    expect(find.text('Barangay Clearance'), findsOneWidget);
    expect(find.text('Purpose: Local Employment Verification'), findsOneWidget);

    // 4. Switch to Tab 3 (Field Reports)
    await tester.tap(find.text('Field Reports'));
    await tester.pumpAndSettle();

    expect(find.text('Clogged Drainage on Purok 4'), findsOneWidget);
    expect(find.text('ENVIRONMENT'), findsOneWidget);
    expect(find.text('In-Progress'), findsOneWidget);
    expect(find.text('Resolve'), findsOneWidget);
  });
}