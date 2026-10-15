import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/config/app_config.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppConfig release and debug URL resolution', () {
    test('release mode defaults to canonical HTTPS production base URL when env is empty', () {
      final url = AppConfig.resolveBaseUrl(
        envBaseUrl: '',
        isReleaseMode: true,
        platform: TargetPlatform.android,
      );

      expect(url, 'https://gridy.onrender.com/api/v1');
      expect(url, AppConfig.productionBaseUrl);
    });

    test('release mode uses explicit HTTPS override provided at build time', () {
      final url = AppConfig.resolveBaseUrl(
        envBaseUrl: 'https://custom-api.gov.ph/api/v1',
        isReleaseMode: true,
        platform: TargetPlatform.android,
      );

      expect(url, 'https://custom-api.gov.ph/api/v1');
    });

    test('release mode rejects cleartext HTTP override', () {
      expect(
        () => AppConfig.resolveBaseUrl(
          envBaseUrl: 'http://10.0.2.2:8000/api/v1',
          isReleaseMode: true,
          platform: TargetPlatform.android,
        ),
        throwsStateError,
      );
    });

    test('release mode rejects arbitrary non-HTTPS scheme', () {
      expect(
        () => AppConfig.resolveBaseUrl(
          envBaseUrl: 'ftp://insecure.test/api/v1',
          isReleaseMode: true,
          platform: TargetPlatform.android,
        ),
        throwsStateError,
      );
    });

    test('release mode rejects HTTPS URLs without a host', () {
      expect(
        () => AppConfig.resolveBaseUrl(
          envBaseUrl: 'https:///api/v1',
          isReleaseMode: true,
        ),
        throwsStateError,
      );
    });

    test('debug mode preserves 10.0.2.2 emulator routing on Android when env is empty', () {
      final url = AppConfig.resolveBaseUrl(
        envBaseUrl: '',
        isReleaseMode: false,
        platform: TargetPlatform.android,
        isWeb: false,
      );

      expect(url, 'http://10.0.2.2:8000/api/v1');
    });

    test('debug mode preserves 127.0.0.1 on Web', () {
      final url = AppConfig.resolveBaseUrl(
        envBaseUrl: '',
        isReleaseMode: false,
        platform: TargetPlatform.android,
        isWeb: true,
      );

      expect(url, 'http://127.0.0.1:8000/api/v1');
    });

    test('debug mode preserves 127.0.0.1 on iOS and desktop platforms', () {
      for (final platform in [
        TargetPlatform.iOS,
        TargetPlatform.macOS,
        TargetPlatform.windows,
        TargetPlatform.linux,
      ]) {
        final url = AppConfig.resolveBaseUrl(
          envBaseUrl: '',
          isReleaseMode: false,
          platform: platform,
          isWeb: false,
        );

        expect(url, 'http://127.0.0.1:8000/api/v1');
      }
    });

    test('debug mode allows explicit custom dev host override', () {
      final url = AppConfig.resolveBaseUrl(
        envBaseUrl: 'http://192.168.1.100:8000/api/v1',
        isReleaseMode: false,
        platform: TargetPlatform.android,
      );

      expect(url, 'http://192.168.1.100:8000/api/v1');
    });
  });

  group('ApiClient and Public Barangay Directory Request', () {
    test('public barangay directory requests resolve to production base URL path', () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();

      final mockClient = MockClient((request) async {
        expect(request.method, 'GET');
        expect(
          request.url.toString(),
          'https://gridy.onrender.com/api/v1/auth/public/barangays/',
        );
        expect(request.headers['authorization'], isNull);

        return http.Response(
          '''
          {
            "count": 2,
            "next": null,
            "previous": null,
            "results": [
              {
                "id": 1,
                "name": "Barangay Poblacion",
                "municipality": "Lucena City",
                "province": "Quezon"
              },
              {
                "id": 2,
                "name": "Barangay San Isidro",
                "municipality": "Tayabas City",
                "province": "Quezon"
              }
            ]
          }
          ''',
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      addTearDown(mockClient.close);

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: AppConfig.productionBaseUrl,
      );
      final service = AuthService(
        apiClient: apiClient,
        storageService: StorageService(preferences),
      );

      final barangays = await service.fetchBarangays();

      expect(barangays, hasLength(2));
      expect(barangays[0].id, 1);
      expect(barangays[0].displayName, 'Barangay Poblacion (Lucena City, Quezon)');
      expect(barangays[1].id, 2);
      expect(barangays[1].displayName, 'Barangay San Isidro (Tayabas City, Quezon)');
    });

    test('public barangay directory request surfaces network failure cleanly', () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();

      final mockClient = MockClient((request) async {
        return http.Response('{"detail": "Not found"}', 404, headers: {
          'content-type': 'application/json',
        });
      });
      addTearDown(mockClient.close);

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: AppConfig.productionBaseUrl,
      );
      final service = AuthService(
        apiClient: apiClient,
        storageService: StorageService(preferences),
      );

      expect(() => service.fetchBarangays(), throwsException);
    });
  });
}
