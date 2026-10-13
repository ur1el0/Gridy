import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/services/field_official_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  Future<StorageService> createStorage() async {
    SharedPreferences.setMockInitialValues({});
    return StorageService(await SharedPreferences.getInstance());
  }

  test('parses field reports from a DRF paginated response', () async {
    final client = MockClient((_) async {
      return http.Response(
        jsonEncode({
          'count': 1,
          'next': null,
          'previous': null,
          'results': [
            {
              'id': 41,
              'title': 'Blocked road',
              'description': 'Water is blocking the access road.',
              'location': 'Purok 2',
              'status': 'PENDING',
              'category': 'INFRASTRUCTURE',
              'urgency': 'HAZARD',
              'created_at': '2026-10-13T08:00:00Z',
            },
          ],
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    addTearDown(client.close);

    final service = FieldOfficialService(
      apiClient: ApiClient(
        client: client,
        baseUrl: 'https://kapitbayan.test/api/v1',
      ),
      storageService: await createStorage(),
    );

    final reports = await service.fetchBarangayIssues();

    expect(reports, hasLength(1));
    expect(reports.single.id, 41);
    expect(reports.single.urgency, 'HAZARD');
  });

  test(
    'propagates service errors instead of returning an empty report list',
    () async {
      final client = MockClient(
        (_) async => http.Response('{"detail":"temporarily unavailable"}', 503),
      );
      addTearDown(client.close);

      final service = FieldOfficialService(
        apiClient: ApiClient(
          client: client,
          baseUrl: 'https://kapitbayan.test/api/v1',
        ),
        storageService: await createStorage(),
      );

      await expectLater(
        service.fetchBarangayIssues(),
        throwsA(
          isA<ApiException>().having(
            (error) => error.statusCode,
            'statusCode',
            503,
          ),
        ),
      );
    },
  );
}
