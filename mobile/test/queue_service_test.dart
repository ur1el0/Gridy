import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/services/queue_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('ticket request sends no client-selected priority field', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    Map<String, dynamic>? submittedBody;
    final client = MockClient((request) async {
      submittedBody = jsonDecode(request.body) as Map<String, dynamic>;
      return http.Response(
        jsonEncode({
          'ticket_id': 1,
          'ticket_number': 'T001',
          'service_type': 'Barangay Clearance',
          'status': 'WAITING',
          'is_priority': false,
        }),
        201,
        headers: {'content-type': 'application/json'},
      );
    });
    final service = QueueService(
      apiClient: ApiClient(client: client, baseUrl: 'https://kapitbayan.test'),
      storageService: StorageService(preferences),
    );

    final ticket = await service.requestTicket(
      serviceType: 'Barangay Clearance',
      notes: 'One copy',
    );

    expect(ticket.ticketNumber, 'T001');
    expect(submittedBody, {
      'service_type': 'Barangay Clearance',
      'notes': 'One copy',
    });
    expect(submittedBody!.containsKey('is_priority'), isFalse);
  });
}
