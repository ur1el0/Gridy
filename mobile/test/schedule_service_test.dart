import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/services/schedule_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('fetchScheduleData throws ScheduleServiceException on complete API failure', () async {
    final prefs = await SharedPreferences.getInstance();
    final storage = StorageService(prefs);

    final client = MockClient((request) async {
      return http.Response('Server Error', 500);
    });

    final service = ScheduleService(
      apiClient: ApiClient(client: client, baseUrl: 'https://kapitbayan.test'),
      storageService: storage,
    );

    expect(
      () => service.fetchScheduleData(),
      throwsA(isA<ScheduleServiceException>()),
    );
  });

  test('fetchScheduleData flags partial failure when activities fail but document requests succeed', () async {
    final prefs = await SharedPreferences.getInstance();
    final storage = StorageService(prefs);

    final client = MockClient((request) async {
      final path = request.url.path;
      if (path.contains('/auth/me/')) {
        return http.Response(
          jsonEncode({
            'id': 1,
            'username': 'juan_test',
            'email': 'juan@example.com',
            'role': 'RESIDENT',
            'full_name': 'Juan Dela Cruz',
            'is_verified': true,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (path.contains('/activities/')) {
        return http.Response('Service unavailable', 503);
      }
      if (path.contains('/document-requests/')) {
        return http.Response(
          jsonEncode([
            {
              'id': 101,
              'document_type': 'Barangay Clearance',
              'status': 'READY_FOR_PICKUP',
              'created_at': '2026-10-12T08:00:00Z',
            },
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response('Not found', 404);
    });

    final service = ScheduleService(
      apiClient: ApiClient(client: client, baseUrl: 'https://kapitbayan.test'),
      storageService: storage,
    );

    final data = await service.fetchScheduleData();

    expect(data.hasActivitiesError, isTrue);
    expect(data.hasAppointmentsError, isFalse);
    expect(data.activities, isEmpty);
    expect(data.documentRequests.length, 1);
    expect(data.errorMessage, isNotNull);
  });

  test('fetchScheduleData flags partial failure when document requests fail but activities succeed', () async {
    final prefs = await SharedPreferences.getInstance();
    final storage = StorageService(prefs);

    final client = MockClient((request) async {
      final path = request.url.path;
      if (path.contains('/auth/me/')) {
        return http.Response(
          jsonEncode({
            'id': 1,
            'username': 'juan_test',
            'email': 'juan@example.com',
            'role': 'RESIDENT',
            'full_name': 'Juan Dela Cruz',
            'is_verified': true,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (path.contains('/activities/')) {
        return http.Response(
          jsonEncode([
            {
              'id': 1,
              'title': 'Community Cleanup Drive',
              'description': 'Barangay clean up',
              'event_datetime': '2026-10-15T09:00:00Z',
              'location': 'Zone 4 Covered Court',
            },
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (path.contains('/document-requests/')) {
        return http.Response('Internal error', 500);
      }
      return http.Response('Not found', 404);
    });

    final service = ScheduleService(
      apiClient: ApiClient(client: client, baseUrl: 'https://kapitbayan.test'),
      storageService: storage,
    );

    final data = await service.fetchScheduleData();

    expect(data.hasActivitiesError, isFalse);
    expect(data.hasAppointmentsError, isTrue);
    expect(data.activities.length, 1);
    expect(data.documentRequests, isEmpty);
    expect(data.errorMessage, isNotNull);
  });

  test('fetchScheduleData returns true empty response when backend has no records', () async {
    final prefs = await SharedPreferences.getInstance();
    final storage = StorageService(prefs);
    await storage.saveUser(const UserModel(
      id: 1,
      username: 'juan_test',
      email: 'juan@example.com',
      role: 'RESIDENT',
      fullName: 'Juan Dela Cruz',
      isVerified: true,
    ));

    final client = MockClient((request) async {
      final path = request.url.path;
      if (path.contains('/auth/me/')) {
        return http.Response(
          jsonEncode({
            'id': 1,
            'username': 'juan_test',
            'email': 'juan@example.com',
            'role': 'RESIDENT',
            'full_name': 'Juan Dela Cruz',
            'is_verified': true,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (path.contains('/activities/')) {
        return http.Response(jsonEncode([]), 200, headers: {'content-type': 'application/json'});
      }
      if (path.contains('/document-requests/')) {
        return http.Response(jsonEncode([]), 200, headers: {'content-type': 'application/json'});
      }
      return http.Response('Not found', 404);
    });

    final service = ScheduleService(
      apiClient: ApiClient(client: client, baseUrl: 'https://kapitbayan.test'),
      storageService: storage,
    );

    final data = await service.fetchScheduleData();

    expect(data.hasActivitiesError, isFalse);
    expect(data.hasAppointmentsError, isFalse);
    expect(data.activities, isEmpty);
    expect(data.documentRequests, isEmpty);
    expect(data.activeAppointments, isEmpty);
    expect(data.getAppointmentsForDate(DateTime(2026, 10, 12)), isEmpty);
  });
}
