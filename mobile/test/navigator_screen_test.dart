import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/models/navigator_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/dashboard_screen.dart';
import 'package:mobile/screens/navigator_screen.dart';
import 'package:mobile/services/dashboard_service.dart';
import 'package:mobile/services/navigator_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakeNavigatorService extends NavigatorService {
  _FakeNavigatorService() : super(apiClient: ApiClient());

  NavigatorQueryResponseModel? nextResponse;
  Object? nextError;
  final List<String> submittedQueries = [];

  @override
  Future<NavigatorQueryResponseModel> submitQuery(String rawQuery) async {
    submittedQueries.add(rawQuery.trim());
    if (nextError != null) {
      throw nextError!;
    }
    return nextResponse ??
        const NavigatorQueryResponseModel(
          status: 'answered',
          answer: 'Default answered response.',
          reason: null,
          sources: [],
          escalation: NavigatorEscalationModel(
            officeContact: '(02) 8123-4567',
            hotlines: [],
            barangayHallNotice: 'Visit Barangay Hall.',
          ),
        );
  }
}

class _FakeDashboardService extends DashboardService {
  _FakeDashboardService({required StorageService storage})
      : super(apiClient: ApiClient(), storageService: storage);

  @override
  Future<DashboardData> fetchDashboardData() async {
    return const DashboardData(
      user: UserModel(
        id: 1,
        username: 'resident_test',
        fullName: 'Juan Dela Cruz',
        email: 'juan@example.com',
        role: 'RESIDENT',
        isVerified: true,
      ),
      announcements: [],
      documentRequests: [],
      activities: [],
      notifications: [],
    );
  }
}

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
  });

  group('NavigatorScreen Widget Tests', () {
    testWidgets('renders initial empty state with safety notice and suggested questions', (tester) async {
      final service = _FakeNavigatorService();

      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Ask Barangay'), findsOneWidget);
      expect(find.text('Public information assistant'), findsOneWidget);
      expect(find.byTooltip('Back'), findsOneWidget);
      expect(find.byTooltip('Clear conversation'), findsNothing);

      // Safety Notice
      expect(find.textContaining('Public information only.'), findsOneWidget);
      expect(find.textContaining('Do not type names, contact numbers'), findsOneWidget);

      // Suggested questions
      expect(find.text('SUGGESTED QUESTIONS'), findsOneWidget);
      expect(find.text('How to get a barangay clearance?'), findsOneWidget);
      expect(find.text('Are first-time jobseekers exempt from fees?'), findsOneWidget);
      expect(find.text('What are the emergency hotlines?'), findsOneWidget);

      // Input Bar
      expect(find.byType(TextField), findsOneWidget);
      expect(find.byTooltip('Send question'), findsOneWidget);
    });

    testWidgets('submits query via suggested question and displays answered turn with sources and escalation', (tester) async {
      final service = _FakeNavigatorService();
      service.nextResponse = NavigatorQueryResponseModel(
        status: 'answered',
        answer: 'You can request a barangay clearance at the Barangay Hall or online.',
        reason: null,
        sources: [
          NavigatorSourceModel(
            id: 'statutory-ra7160',
            title: 'Barangay Clearance Provisions',
            category: 'statutory',
            reference: 'RA 7160 Section 152(c)',
            updatedAt: DateTime(2026, 10, 12),
          ),
        ],
        escalation: const NavigatorEscalationModel(
          officeContact: '(02) 8123-4567',
          hotlines: [
            NavigatorHotlineModel(
              name: 'Barangay Patrol',
              number: '0917-111-2222',
              category: 'POLICE',
            ),
          ],
          barangayHallNotice: 'Please visit the Barangay Hall for assistance.',
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      // Tap suggested question
      await tester.tap(find.text('How to get a barangay clearance?'));
      await tester.pump(); // Start request

      expect(service.submittedQueries, contains('How to get a barangay clearance?'));

      await tester.pumpAndSettle(); // Settle response

      // Response rendered
      expect(find.text('Answer from public records'), findsOneWidget);
      expect(find.text('You can request a barangay clearance at the Barangay Hall or online.'), findsOneWidget);
      expect(find.text('SOURCES CITED'), findsOneWidget);
      expect(find.text('Barangay Clearance Provisions'), findsOneWidget);
      expect(find.text('Reference: RA 7160 Section 152(c)'), findsOneWidget);
      expect(find.textContaining('Updated Oct 12, 2026'), findsOneWidget);

      // Escalation tile is present
      expect(find.text('Barangay Hall & emergency contacts'), findsOneWidget);
      await tester.tap(find.text('Barangay Hall & emergency contacts'));
      await tester.pumpAndSettle();

      expect(find.text('Please visit the Barangay Hall for assistance.'), findsOneWidget);
      expect(find.text('Barangay office: (02) 8123-4567'), findsOneWidget);
      expect(find.text('Barangay Patrol'), findsOneWidget);
      expect(find.text('0917-111-2222'), findsOneWidget);

      // Clear conversation button is now visible in AppBar
      expect(find.byTooltip('Clear conversation'), findsOneWidget);
    });

    testWidgets('submits typed query in input field and displays privacy notice abstention', (tester) async {
      final service = _FakeNavigatorService();
      service.nextResponse = const NavigatorQueryResponseModel(
        status: 'abstained',
        answer: 'For your security, please do not include account numbers or passwords.',
        reason: 'privacy_guard_credentials',
        sources: [],
        escalation: NavigatorEscalationModel(
          officeContact: null,
          hotlines: [],
          barangayHallNotice: 'Visit the Barangay Hall for personal account questions.',
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'Here is my password: 12345');
      await tester.tap(find.byTooltip('Send question'));
      await tester.pumpAndSettle();

      expect(service.submittedQueries, contains('Here is my password: 12345'));
      expect(find.text('Privacy notice'), findsOneWidget);
      expect(find.text('For your security, please do not include account numbers or passwords.'), findsOneWidget);
    });

    testWidgets('displays retry button on assistant-unavailable response and resubmits on tap', (tester) async {
      final service = _FakeNavigatorService();
      service.nextResponse = const NavigatorQueryResponseModel(
        status: 'unavailable',
        answer: 'The assistant service timed out while generating a response.',
        reason: 'provider_timeout',
        sources: [],
        escalation: NavigatorEscalationModel(
          officeContact: null,
          hotlines: [],
          barangayHallNotice: 'Visit the Barangay Hall for immediate inquiries.',
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'What are the fees for indigency?');
      await tester.tap(find.byTooltip('Send question'));
      await tester.pumpAndSettle();

      expect(find.text('Assistant unavailable'), findsOneWidget);
      expect(find.widgetWithText(OutlinedButton, 'Try again'), findsOneWidget);

      // Prepare answered response for retry
      service.nextResponse = const NavigatorQueryResponseModel(
        status: 'answered',
        answer: 'Certificate of Indigency is issued free of charge.',
        reason: null,
        sources: [],
        escalation: NavigatorEscalationModel(
          officeContact: null,
          hotlines: [],
          barangayHallNotice: 'Visit Barangay Hall.',
        ),
      );

      await tester.tap(find.widgetWithText(OutlinedButton, 'Try again'));
      await tester.pumpAndSettle();

      expect(service.submittedQueries.length, 2);
      expect(service.submittedQueries[1], 'What are the fees for indigency?');
      expect(find.text('Certificate of Indigency is issued free of charge.'), findsOneWidget);
    });

    testWidgets('shows network error alert with retry button when transport fails', (tester) async {
      final service = _FakeNavigatorService();
      service.nextError = const NetworkException();

      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'Is the barangay hall open?');
      await tester.tap(find.byTooltip('Send question'));
      await tester.pumpAndSettle();

      expect(
        find.text('We could not reach the assistant. Check your connection and try again, or contact the Barangay Hall.'),
        findsOneWidget,
      );
      expect(find.widgetWithText(OutlinedButton, 'Try again'), findsOneWidget);

      // Clear error and supply response for retry
      service.nextError = null;
      service.nextResponse = const NavigatorQueryResponseModel(
        status: 'answered',
        answer: 'The barangay hall operates Monday to Friday, 8:00 AM to 5:00 PM.',
        reason: null,
        sources: [],
        escalation: NavigatorEscalationModel(
          officeContact: null,
          hotlines: [],
          barangayHallNotice: 'Visit the Barangay Hall.',
        ),
      );

      await tester.tap(find.widgetWithText(OutlinedButton, 'Try again'));
      await tester.pumpAndSettle();

      expect(find.text('The barangay hall operates Monday to Friday, 8:00 AM to 5:00 PM.'), findsOneWidget);
    });

    testWidgets('clear conversation button empties turns in memory and resets state', (tester) async {
      final service = _FakeNavigatorService();
      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'First question');
      await tester.tap(find.byTooltip('Send question'));
      await tester.pumpAndSettle();

      expect(find.text('First question'), findsOneWidget);
      expect(find.byTooltip('Clear conversation'), findsOneWidget);

      // Tap clear conversation
      await tester.tap(find.byTooltip('Clear conversation'));
      await tester.pumpAndSettle();

      // State is reset, turns cleared from memory
      expect(find.text('First question'), findsNothing);
      expect(find.byTooltip('Clear conversation'), findsNothing);
      expect(find.text('SUGGESTED QUESTIONS'), findsOneWidget);
    });

    testWidgets('DashboardScreen Ask Barangay card navigates to NavigatorScreen', (tester) async {
      final prefs = await SharedPreferences.getInstance();
      final storage = StorageService(prefs);
      final dashboardService = _FakeDashboardService(storage: storage);

      await tester.pumpWidget(
        MaterialApp(
          home: DashboardScreen(dashboardService: dashboardService),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Ask Barangay'), findsOneWidget);
      await tester.ensureVisible(find.text('Ask Barangay'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ask Barangay'));
      await tester.pumpAndSettle();

      expect(find.byType(NavigatorScreen), findsOneWidget);
      expect(find.text('Public information assistant'), findsOneWidget);
    });

    testWidgets('meets touch target minimum accessibility constraints', (tester) async {
      final service = _FakeNavigatorService();
      await tester.pumpWidget(
        MaterialApp(
          home: NavigatorScreen(navigatorService: service),
        ),
      );
      await tester.pumpAndSettle();

      // Back button size >= 48x48
      final backButton = tester.getSize(find.byTooltip('Back'));
      expect(backButton.width, greaterThanOrEqualTo(48.0));
      expect(backButton.height, greaterThanOrEqualTo(48.0));

      // Send button size >= 48x48
      final sendButton = tester.getSize(find.byTooltip('Send question'));
      expect(sendButton.width, greaterThanOrEqualTo(48.0));
      expect(sendButton.height, greaterThanOrEqualTo(48.0));

      // Suggested question item minHeight >= 48.0
      final suggestion = tester.getSize(find.widgetWithText(InkWell, 'How to get a barangay clearance?'));
      expect(suggestion.height, greaterThanOrEqualTo(48.0));
    });
  });
}
