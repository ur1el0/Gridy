import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/services/document_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'submits a trimmed GCash reference and parses manual review status',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      late http.Request submittedRequest;
      final mockClient = MockClient((request) async {
        submittedRequest = request;
        return http.Response(
          jsonEncode({
            'request_id': 12,
            'document_type': 'Barangay Clearance',
            'status': 'READY_FOR_PICKUP',
            'fee_amount': '50.00',
            'payment_method': 'GCASH',
            'payment_reference': 'TRANSFER-100',
            'payment_status': 'PENDING_VERIFICATION',
            'payment_review_note': '',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      addTearDown(mockClient.close);

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'https://gridy.test/api/v1',
      )..setAuthCredentials(accessToken: 'resident-token');
      final service = DocumentService(
        apiClient: apiClient,
        storageService: StorageService(preferences),
      );

      final document = await service.submitPaymentReference(
        requestId: 12,
        paymentReference: '  TRANSFER-100  ',
      );

      expect(submittedRequest.method, 'POST');
      expect(
        submittedRequest.url.path,
        '/api/v1/document-requests/12/payment-reference/',
      );
      expect(jsonDecode(submittedRequest.body), {
        'payment_reference': 'TRANSFER-100',
      });
      expect(document.id, 12);
      expect(document.paymentMethod, 'GCASH');
      expect(document.paymentStatus, 'PENDING_VERIFICATION');
    },
  );
}
