import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/services/document_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DocumentService Payment Multipart & Proof Tests (REV-06)', () {
    test(
      'submits multipart request with reference, recipient, datetime, and receipt bytes',
      () async {
        SharedPreferences.setMockInitialValues({});
        final preferences = await SharedPreferences.getInstance();

        late http.BaseRequest submittedBaseRequest;
        late List<int> submittedBodyBytes;

        final mockClient = MockClient.streaming((request, bodyStream) async {
          submittedBaseRequest = request;
          submittedBodyBytes = await bodyStream.toBytes();
          return http.StreamedResponse(
            Stream.value(
              utf8.encode(
                jsonEncode({
                  'request_id': 12,
                  'document_type': 'Barangay Clearance',
                  'status': 'READY_FOR_PICKUP',
                  'fee_amount': '50.00',
                  'payment_method': 'GCASH',
                  'payment_recipient': 7,
                  'payment_recipient_id': 7,
                  'payment_reference': 'GCASH-998877',
                  'payment_status': 'PENDING_VERIFICATION',
                  'payment_review_note': '',
                  'payment_transacted_at': '2026-10-13T10:30:00.000Z',
                  'payment_proof_url':
                      '/api/v1/document-requests/12/payment-proof/',
                }),
              ),
            ),
            200,
            headers: {'content-type': 'application/json'},
          );
        });
        addTearDown(mockClient.close);

        final apiClient = ApiClient(
          client: mockClient,
          baseUrl: 'https://kapitbayan.test/api/v1',
        )..setAuthCredentials(accessToken: 'resident-token');

        final service = DocumentService(
          apiClient: apiClient,
          storageService: StorageService(preferences),
        );

        final sampleProofBytes = Uint8List.fromList([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, // JPEG header
        ]);
        final transactedDate = DateTime.parse('2026-10-13T10:30:00.000Z');

        final document = await service.submitPaymentReference(
          requestId: 12,
          paymentRecipientId: 7,
          paymentReference: '  GCASH-998877  ',
          transactedAt: transactedDate,
          proofImageBytes: sampleProofBytes,
          proofImageFilename: 'my_receipt.jpg',
        );

        expect(submittedBaseRequest.method, 'POST');
        expect(
          submittedBaseRequest.url.path,
          '/api/v1/document-requests/12/payment-reference/',
        );
        expect(submittedBaseRequest, isA<http.MultipartRequest>());

        final multipart = submittedBaseRequest as http.MultipartRequest;
        expect(multipart.fields['payment_recipient_id'], '7');
        expect(multipart.fields['payment_reference'], 'GCASH-998877');
        expect(
          multipart.fields['payment_transacted_at'],
          '2026-10-13T10:30:00.000Z',
        );
        expect(multipart.files.length, 1);
        expect(multipart.files.first.field, 'payment_proof_image');
        expect(multipart.files.first.filename, 'my_receipt.jpg');

        // Verify file bytes were transmitted in multipart stream
        expect(submittedBodyBytes, isNotEmpty);
        final bodyString = latin1.decode(submittedBodyBytes);
        expect(bodyString, contains('name="payment_proof_image"'));
        expect(bodyString, contains('filename="my_receipt.jpg"'));
        expect(bodyString, contains('name="payment_reference"'));
        expect(bodyString, contains('GCASH-998877'));

        // Verify returned DocumentRequestModel parsing
        expect(document.id, 12);
        expect(document.paymentMethod, 'GCASH');
        expect(document.paymentRecipientId, 7);
        expect(document.paymentReference, 'GCASH-998877');
        expect(document.paymentStatus, 'PENDING_VERIFICATION');
        expect(
          document.paymentProofUrl,
          '/api/v1/document-requests/12/payment-proof/',
        );
        expect(document.paymentTransactedAt, transactedDate);
      },
    );

    test(
      'submits multipart request without optional proof image',
      () async {
        SharedPreferences.setMockInitialValues({});
        final preferences = await SharedPreferences.getInstance();

        late http.BaseRequest submittedBaseRequest;
        final mockClient = MockClient.streaming((request, bodyStream) async {
          submittedBaseRequest = request;
          return http.StreamedResponse(
            Stream.value(
              utf8.encode(
                jsonEncode({
                  'request_id': 15,
                  'document_type': 'Barangay Clearance',
                  'status': 'READY_FOR_PICKUP',
                  'fee_amount': '50.00',
                  'payment_method': 'MAYA',
                  'payment_recipient': 3,
                  'payment_reference': 'MAYA-112233',
                  'payment_status': 'PENDING_VERIFICATION',
                }),
              ),
            ),
            200,
            headers: {'content-type': 'application/json'},
          );
        });
        addTearDown(mockClient.close);

        final apiClient = ApiClient(
          client: mockClient,
          baseUrl: 'https://kapitbayan.test/api/v1',
        )..setAuthCredentials(accessToken: 'resident-token');

        final service = DocumentService(
          apiClient: apiClient,
          storageService: StorageService(preferences),
        );

        final document = await service.submitPaymentReference(
          requestId: 15,
          paymentRecipientId: 3,
          paymentReference: 'MAYA-112233',
        );

        expect(submittedBaseRequest, isA<http.MultipartRequest>());
        final multipart = submittedBaseRequest as http.MultipartRequest;
        expect(multipart.fields['payment_recipient_id'], '3');
        expect(multipart.fields['payment_reference'], 'MAYA-112233');
        expect(multipart.files, isEmpty);
        expect(document.paymentStatus, 'PENDING_VERIFICATION');
      },
    );

    test(
      'fetches private authenticated payment proof image bytes',
      () async {
        SharedPreferences.setMockInitialValues({});
        final preferences = await SharedPreferences.getInstance();

        final mockImageBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]; // PNG header
        final mockClient = MockClient((request) async {
          expect(request.method, 'GET');
          expect(
            request.url.path,
            '/api/v1/document-requests/42/payment-proof/',
          );
          return http.Response.bytes(
            mockImageBytes,
            200,
            headers: {
              'content-type': 'image/png',
              'cache-control': 'private, no-store, max-age=0',
            },
          );
        });
        addTearDown(mockClient.close);

        final apiClient = ApiClient(
          client: mockClient,
          baseUrl: 'https://kapitbayan.test/api/v1',
        )..setAuthCredentials(accessToken: 'staff-token');

        final service = DocumentService(
          apiClient: apiClient,
          storageService: StorageService(preferences),
        );

        final fetchedBytes = await service.fetchPaymentProof(42);
        expect(fetchedBytes, equals(mockImageBytes));
      },
    );
  });
}
