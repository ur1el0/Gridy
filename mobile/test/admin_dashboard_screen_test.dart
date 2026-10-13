import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/screens/admin_dashboard_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('reads the honest waiting_in_queue dashboard metric', (
    WidgetTester tester,
  ) async {
    final mockClient = MockClient((request) async {
      expect(request.url.path, '/api/v1/dashboard/summary/');
      return http.Response(
        jsonEncode({
          'total_residents': 0,
          'document_requests': {'pending': 0},
          'issue_reports': {'pending': 0},
          'queue_activity': {
            'serving_now': 'A-007',
            'waiting_in_queue': 7,
            'waiting_count': 99,
          },
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    addTearDown(mockClient.close);

    await tester.pumpWidget(
      MaterialApp(
        home: AdminDashboardScreen(
          apiClient: ApiClient(
            client: mockClient,
            baseUrl: 'https://kapitbayan.test/api/v1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Waiting Queue'), findsOneWidget);
    expect(find.text('7'), findsOneWidget);
    expect(find.text('99'), findsNothing);
  });
}
