import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/models/barangay_model.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'loads the approved barangay directory with municipal locality',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      final mockClient = MockClient((request) async {
        expect(request.url.path, '/api/v1/auth/public/barangays/');
        return http.Response(
          '[{"id":8,"name":"Barangay Mabini","municipality":"Lucena City","province":"Quezon"}]',
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      addTearDown(mockClient.close);
      final service = AuthService(
        apiClient: ApiClient(
          client: mockClient,
          baseUrl: 'https://gridy.test/api/v1',
        ),
        storageService: StorageService(preferences),
      );

      final barangays = await service.fetchBarangays();

      expect(barangays, hasLength(1));
      expect(barangays.single, isA<BarangayModel>());
      expect(
        barangays.single.displayName,
        'Barangay Mabini (Lucena City, Quezon)',
      );
    },
  );

  test(
    'sends privacy consent and version with resident registration',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      final apiClient = RecordingApiClient();
      final authService = AuthService(
        apiClient: apiClient,
        storageService: StorageService(preferences),
      );

      await authService.register(
        fullName: 'Test Resident',
        username: 'resident1',
        email: 'resident@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        voterStatus: false,
        privacyConsent: true,
      );

      expect(apiClient.capturedFields?['privacy_consent'], 'true');
      expect(
        apiClient.capturedFields?['privacy_consent_version'],
        'resident-v1',
      );
      expect(apiClient.capturedRequiresAuth, isFalse);
    },
  );
}

class RecordingApiClient extends ApiClient {
  RecordingApiClient() : super(baseUrl: 'https://gridy.test');

  Map<String, String>? capturedFields;
  bool? capturedRequiresAuth;

  @override
  Future<http.Response> postMultipart(
    String endpoint, {
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
    bool requiresAuth = true,
  }) async {
    capturedFields = Map<String, String>.from(fields ?? <String, String>{});
    capturedRequiresAuth = requiresAuth;

    return http.Response(
      '{"id":1,"username":"resident1","email":"resident@example.com",'
      '"role":"RESIDENT","full_name":"Test Resident"}',
      201,
      headers: {'content-type': 'application/json'},
    );
  }
}
