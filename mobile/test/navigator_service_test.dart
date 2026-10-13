import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/models/navigator_model.dart';
import 'package:mobile/services/navigator_service.dart';

void main() {
  group('NavigatorService', () {
    test('submits valid query to /public/navigator/query/ with strict payload and auth', () async {
      final mockClient = MockClient((request) async {
        expect(request.method, 'POST');
        expect(request.url.path, '/api/v1/public/navigator/query/');
        expect(request.headers['authorization'], 'Bearer test-resident-token');

        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body, {'query': 'How to get a barangay clearance?'});

        return http.Response(
          jsonEncode({
            'status': 'answered',
            'answer': 'You can apply for a barangay clearance by presenting a valid ID.',
            'reason': null,
            'sources': [
              {
                'id': 'statutory-ra7160-sec152c',
                'title': 'Barangay Clearance (Local Government Code)',
                'category': 'statutory',
                'reference': 'RA 7160 Section 152(c)',
                'updated_at': '2026-10-12T00:00:00Z',
              }
            ],
            'escalation': {
              'office_contact': '(02) 8123-4567',
              'hotlines': [
                {
                  'name': 'Barangay Emergency Desk',
                  'number': '0917-123-4567',
                  'category': 'BARANGAY',
                }
              ],
              'barangay_hall_notice': 'Visit the Barangay Hall for processing.',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      addTearDown(mockClient.close);

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://127.0.0.1:8000/api/v1',
      )..setAuthCredentials(accessToken: 'test-resident-token');

      final service = NavigatorService(apiClient: apiClient);
      final response = await service.submitQuery('  How to get a barangay clearance?  ');

      expect(response.status, 'answered');
      expect(response.isAnswered, isTrue);
      expect(response.isUnavailable, isFalse);
      expect(response.isAbstained, isFalse);
      expect(response.answer, contains('valid ID'));
      expect(response.sources.length, 1);
      expect(response.sources.first.title, contains('Local Government Code'));
      expect(response.sources.first.reference, 'RA 7160 Section 152(c)');
      expect(response.sources.first.updatedAt, isNotNull);
      expect(response.escalation.officeContact, '(02) 8123-4567');
      expect(response.escalation.hotlines.first.number, '0917-123-4567');
    });

    test('validates and rejects empty or oversized query before network call', () async {
      final mockClient = MockClient((_) async => http.Response('{}', 200));
      addTearDown(mockClient.close);

      final apiClient = ApiClient(client: mockClient);
      final service = NavigatorService(apiClient: apiClient);

      expect(() => service.submitQuery('   '), throwsA(isA<ApiException>()));
      expect(() => service.submitQuery('a' * 501), throwsA(isA<ApiException>()));
    });

    test('parses privacy notice abstention response', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'status': 'abstained',
            'answer': 'For privacy and security, do not share sensitive personal information.',
            'reason': 'privacy_guard_id_number',
            'sources': [],
            'escalation': {
              'office_contact': null,
              'hotlines': [],
              'barangay_hall_notice': 'Please visit your local Barangay Hall.',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      addTearDown(mockClient.close);

      final service = NavigatorService(apiClient: ApiClient(client: mockClient));
      final response = await service.submitQuery('My PhilSys ID is 1234-5678-9012-3456');

      expect(response.status, 'abstained');
      expect(response.isAbstained, isTrue);
      expect(response.isPrivacyNotice, isTrue);
      expect(response.isRetryable, isFalse);
      expect(response.sources, isEmpty);
    });

    test('correctly evaluates response retryability for provider failures vs feature disabled', () {
      final timeoutResponse = NavigatorQueryResponseModel.fromJson({
        'status': 'unavailable',
        'answer': 'Assistant service timed out.',
        'reason': 'provider_timeout',
        'sources': [],
        'escalation': {
          'office_contact': null,
          'hotlines': [],
          'barangay_hall_notice': 'Visit Barangay Hall.',
        },
      });
      expect(timeoutResponse.isRetryable, isTrue);

      final errorResponse = NavigatorQueryResponseModel.fromJson({
        'status': 'unavailable',
        'answer': 'Provider error.',
        'reason': 'provider_error',
        'sources': [],
        'escalation': {
          'office_contact': null,
          'hotlines': [],
          'barangay_hall_notice': 'Visit Barangay Hall.',
        },
      });
      expect(errorResponse.isRetryable, isTrue);

      final disabledResponse = NavigatorQueryResponseModel.fromJson({
        'status': 'unavailable',
        'answer': 'The assistant is currently disabled.',
        'reason': 'feature_disabled',
        'sources': [],
        'escalation': {
          'office_contact': null,
          'hotlines': [],
          'barangay_hall_notice': 'Visit Barangay Hall.',
        },
      });
      expect(disabledResponse.isRetryable, isFalse);
    });

    test('isRequestErrorRetryable returns true strictly for network errors, 429, and 5xx', () {
      final service = NavigatorService(apiClient: ApiClient());

      expect(service.isRequestErrorRetryable(const NetworkException()), isTrue);
      expect(service.isRequestErrorRetryable(const ApiException('Too Many Requests', statusCode: 429)), isTrue);
      expect(service.isRequestErrorRetryable(const ApiException('Internal Error', statusCode: 500)), isTrue);
      expect(service.isRequestErrorRetryable(const ApiException('Service Unavailable', statusCode: 503)), isTrue);

      expect(service.isRequestErrorRetryable(ValidationException('Bad Request')), isFalse);
      expect(service.isRequestErrorRetryable(const UnauthorizedException()), isFalse);
      expect(service.isRequestErrorRetryable(const ForbiddenException()), isFalse);
      expect(service.isRequestErrorRetryable(const NotFoundException()), isFalse);
      expect(service.isRequestErrorRetryable(Exception('Runtime failure')), isFalse);
      expect(service.isRequestErrorRetryable(const FormatException('Bad JSON')), isFalse);
    });

    test('getRequestErrorMessage returns appropriate user-facing copy', () {
      final service = NavigatorService(apiClient: ApiClient());

      expect(
        service.getRequestErrorMessage(const ApiException('', statusCode: 429)),
        contains('too many questions in a short time'),
      );
      expect(
        service.getRequestErrorMessage(const ApiException('', statusCode: 400)),
        contains('could not be processed'),
      );
      expect(
        service.getRequestErrorMessage(const ApiException('', statusCode: 401)),
        contains('session has expired'),
      );
      expect(
        service.getRequestErrorMessage(const ApiException('', statusCode: 403)),
        contains('Only verified residents can use the navigator'),
      );
      expect(
        service.getRequestErrorMessage(const ApiException('', statusCode: 500)),
        contains('temporary error'),
      );
      expect(
        service.getRequestErrorMessage(const NetworkException()),
        contains('could not reach the assistant'),
      );
    });
  });
}
