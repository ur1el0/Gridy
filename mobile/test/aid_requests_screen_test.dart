import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/screens/aid_requests_screen.dart';
import 'package:mobile/services/aid_request_service.dart';

class _FakeAidRequestService extends AidRequestService {
  _FakeAidRequestService() : super(apiClient: ApiClient());

  final requests = <Map<String, dynamic>>[
    {
      'id': 1,
      'assistance_type': 'Medical assistance',
      'reason': 'Help with a clinic bill.',
      'status': 'UNDER_REVIEW',
      'staff_notes': '',
    },
  ];
  String? submittedReason;

  @override
  Future<List<Map<String, dynamic>>> fetchRequests() async => requests;

  @override
  Future<Map<String, dynamic>> createRequest({
    required String assistanceType,
    required String reason,
  }) async {
    submittedReason = reason;
    final request = {
      'id': 2,
      'assistance_type': assistanceType,
      'reason': reason,
      'status': 'PENDING',
      'staff_notes': '',
    };
    requests.insert(0, request);
    return request;
  }
}

void main() {
  testWidgets('shows manual review status and submits an assistance request', (
    tester,
  ) async {
    final service = _FakeAidRequestService();
    await tester.pumpWidget(
      MaterialApp(home: AidRequestsScreen(aidRequestService: service)),
    );
    await tester.pumpAndSettle();

    expect(find.text('Barangay Assistance'), findsOneWidget);
    expect(find.text('Under review'), findsOneWidget);
    expect(find.text('Requesting assistance'), findsNothing);

    await tester.enterText(
      find.byType(TextField),
      '  Request help with school expenses.  ',
    );
    await tester.tap(find.text('Submit for review'));
    await tester.pumpAndSettle();

    expect(service.submittedReason, 'Request help with school expenses.');
    expect(find.text('Request help with school expenses.'), findsOneWidget);
    expect(
      find.text('Request submitted for barangay staff review.'),
      findsOneWidget,
    );
  });
}
