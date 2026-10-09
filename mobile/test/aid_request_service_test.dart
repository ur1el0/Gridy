import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/services/aid_request_service.dart';

void main() {
  test(
    'reads paginated requests and submits only resident-entered fields',
    () async {
      final mockClient = MockClient((request) async {
        expect(request.headers['authorization'], 'Bearer resident-token');
        if (request.method == 'GET') {
          return http.Response(
            jsonEncode({
              'count': 1,
              'results': [
                {
                  'id': 8,
                  'assistance_type': 'Medical assistance',
                  'reason': 'Clinic expense',
                  'status': 'PENDING',
                  'staff_notes': '',
                },
              ],
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }

        expect(request.method, 'POST');
        expect(jsonDecode(request.body), {
          'assistance_type': 'Food assistance',
          'reason': 'Temporary household need',
        });
        return http.Response(
          jsonEncode({
            'id': 9,
            'assistance_type': 'Food assistance',
            'reason': 'Temporary household need',
            'status': 'PENDING',
            'staff_notes': '',
          }),
          201,
          headers: {'content-type': 'application/json'},
        );
      });
      addTearDown(mockClient.close);

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'https://gridy.test/api/v1',
      )..setAuthCredentials(accessToken: 'resident-token');
      final service = AidRequestService(apiClient: apiClient);

      final requests = await service.fetchRequests();
      final created = await service.createRequest(
        assistanceType: 'Food assistance',
        reason: '  Temporary household need  ',
      );

      expect(requests.single['id'], 8);
      expect(created['id'], 9);
    },
  );
}
