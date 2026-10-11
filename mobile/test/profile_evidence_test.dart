import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/config/app_config.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/profile_screen.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockRecordingApiClient extends ApiClient {
  MockRecordingApiClient() : super(baseUrl: 'http://127.0.0.1:8000/api/v1');

  Map<String, dynamic>? lastPatchBody;
  Map<String, String>? lastMultipartFields;
  List<http.MultipartFile>? lastMultipartFiles;
  int mockStatusCode = 200;
  Map<String, dynamic> mockResponseBody = {};

  @override
  Future<http.Response> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    lastPatchBody = body;
    return http.Response(
      jsonEncode(mockResponseBody),
      mockStatusCode,
      headers: {'content-type': 'application/json'},
    );
  }

  @override
  Future<http.Response> patchMultipart(
    String endpoint, {
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
    bool requiresAuth = true,
  }) async {
    lastMultipartFields = fields;
    lastMultipartFiles = files;
    return http.Response(
      jsonEncode(mockResponseBody),
      mockStatusCode,
      headers: {'content-type': 'application/json'},
    );
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('UserModel Evidence Extensions', () {
    test('parses evidence documents, resident ID, and metadata from profile JSON', () {
      final json = {
        'id': 101,
        'username': 'juan_resident',
        'email': 'juan@example.com',
        'role': 'RESIDENT',
        'full_name': 'Juan Dela Cruz',
        'profile': {
          'id': 42,
          'is_verified': true,
          'contact_number': '09171234567',
          'birth_date': '1990-01-01',
          'voter_status': true,
          'philsys_id_number': '1111-2222-3333-4444',
          'philsys_id_photo': 'auth/resident/42/media/philsys_id_photo/',
          'secondary_id_type': 'Passport',
          'secondary_id_photo': 'auth/resident/42/media/secondary_id_photo/',
          'utility_billing_type': null,
          'utility_billing_photo': null,
        },
      };

      final user = UserModel.fromJson(json);

      expect(user.id, 101);
      expect(user.residentId, 42);
      expect(user.philsysIdNumber, '1111-2222-3333-4444');
      expect(user.philsysIdPhoto, 'auth/resident/42/media/philsys_id_photo/');
      expect(user.secondaryIdType, 'Passport');
      expect(user.secondaryIdPhoto, 'auth/resident/42/media/secondary_id_photo/');
      expect(user.utilityBillingPhoto, isNull);
      expect(user.hasPhilsysPhoto, isTrue);
      expect(user.hasSecondaryIdPhoto, isTrue);
      expect(user.hasUtilityBillingPhoto, isFalse);
      expect(user.proofDocumentsCount, 2);

      final exported = user.toJson();
      expect(exported['resident_id'], 42);
      expect(exported['philsys_id_number'], '1111-2222-3333-4444');
      expect(exported['secondary_id_type'], 'Passport');
    });

    test('handles legacy RBI imported accounts with zero proofs correctly', () {
      final json = {
        'id': 102,
        'username': 'rbi_resident',
        'email': 'rbi@example.com',
        'role': 'RESIDENT',
        'profile': {
          'id': 55,
          'full_name': 'Legacy Census Resident',
          'philsys_id_photo': null,
          'secondary_id_photo': null,
          'utility_billing_photo': null,
        },
      };

      final user = UserModel.fromJson(json);

      expect(user.hasPhilsysPhoto, isFalse);
      expect(user.hasSecondaryIdPhoto, isFalse);
      expect(user.hasUtilityBillingPhoto, isFalse);
      expect(user.proofDocumentsCount, 0);
    });
  });

  group('AuthService updateProfile evidence handling', () {
    late SharedPreferences prefs;
    late StorageService storage;
    late MockRecordingApiClient apiClient;
    late AuthService authService;

    setUp(() async {
      prefs = await SharedPreferences.getInstance();
      storage = StorageService(prefs);
      apiClient = MockRecordingApiClient();
      authService = AuthService(apiClient: apiClient, storageService: storage);
    });

    test('sends JSON patch when updating fields without new files', () async {
      apiClient.mockStatusCode = 200;
      apiClient.mockResponseBody = {
        'id': 1,
        'username': 'resident',
        'email': 'res@example.com',
        'role': 'RESIDENT',
        'full_name': 'Updated Name',
        'profile': {
          'id': 10,
          'full_name': 'Updated Name',
          'contact_number': '09998887777',
          'philsys_id_photo': 'auth/resident/10/media/philsys_id_photo/',
        },
      };

      final updated = await authService.updateProfile(
        fullName: 'Updated Name',
        contactNumber: '09998887777',
        removeSecondaryIdPhoto: true,
      );

      expect(apiClient.lastPatchBody, isNotNull);
      final profile = apiClient.lastPatchBody!['profile'] as Map<String, dynamic>;
      expect(profile['full_name'], 'Updated Name');
      expect(profile['contact_number'], '09998887777');
      expect(profile['remove_secondary_id_photo'], isTrue);
      expect(updated.fullName, 'Updated Name');

      final cachedUser = storage.getUser();
      expect(cachedUser?.fullName, 'Updated Name');
    });

    test('extracts verification_documents error message on 400 rejection', () async {
      apiClient.mockStatusCode = 400;
      apiClient.mockResponseBody = {
        'profile': {
          'verification_documents': [
            'Cannot remove the only proof document on file. Residents must maintain at least one valid identity or residency proof document.'
          ]
        }
      };

      expect(
        () => authService.updateProfile(removePhilsysPhoto: true),
        throwsA(
          predicate(
            (e) =>
                e is ApiException &&
                e.message.contains('Cannot remove the only proof document on file'),
          ),
        ),
      );
    });

    test('getAuthenticatedMediaUrl builds absolute URL properly', () {
      final url = authService.getAuthenticatedMediaUrl('auth/resident/5/media/philsys_id_photo/');
      final cleanBase = AppConfig.baseUrl.replaceAll(RegExp(r'/+$'), '');
      expect(url, '$cleanBase/auth/resident/5/media/philsys_id_photo/');
    });
  });

  group('ProfileScreen Widget Tests', () {
    late SharedPreferences prefs;
    late StorageService storage;
    late MockRecordingApiClient apiClient;
    late AuthService authService;

    final baseUserWithOneProof = UserModel(
      id: 1,
      username: 'resident_test',
      email: 'resident@test.ph',
      role: 'RESIDENT',
      fullName: 'Maria Santos',
      contactNumber: '09123456789',
      birthDate: '1995-05-15',
      voterStatus: true,
      residentId: 25,
      philsysIdNumber: '9876-5432-1098-7654',
      philsysIdPhoto: 'auth/resident/25/media/philsys_id_photo/',
    );

    final userWithTwoProofs = UserModel(
      id: 2,
      username: 'resident_two_proofs',
      email: 'two@test.ph',
      role: 'RESIDENT',
      fullName: 'Jose Rizal',
      contactNumber: '09112223334',
      residentId: 26,
      philsysIdNumber: '1111-2222-3333-4444',
      philsysIdPhoto: 'auth/resident/26/media/philsys_id_photo/',
      utilityBillingType: 'Electric / Meralco',
      utilityBillingPhoto: 'auth/resident/26/media/utility_billing_photo/',
    );

    final rbiUserZeroProofs = UserModel(
      id: 3,
      username: 'rbi_zero',
      email: 'rbi@test.ph',
      role: 'RESIDENT',
      fullName: 'Andres Bonifacio',
      residentId: 27,
    );

    setUp(() async {
      prefs = await SharedPreferences.getInstance();
      storage = StorageService(prefs);
      apiClient = MockRecordingApiClient();
      authService = AuthService(apiClient: apiClient, storageService: storage);
    });

    Widget createProfileWidget(UserModel user) {
      return MaterialApp(
        theme: AppTheme.lightTheme,
        home: ProfileScreen(
          user: user,
          authService: authService,
        ),
      );
    }

    testWidgets('renders document on-file indicators and VIEW buttons in view mode', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createProfileWidget(baseUserWithOneProof));
      await tester.pumpAndSettle();

      expect(find.text('IDENTITY & RESIDENCY PROOF'), findsOneWidget);
      expect(find.text('PhilSys National ID'), findsOneWidget);
      expect(find.text('ID No: 9876-5432-1098-7654'), findsOneWidget);
      expect(find.text('VIEW'), findsOneWidget); // PhilSys is on file

      expect(find.text('Secondary Valid ID'), findsOneWidget);
      expect(find.text('Not on file'), findsNWidgets(2)); // Secondary and Utility
    });

    testWidgets('shows warning notice for zero-proof legacy account in view mode', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createProfileWidget(rbiUserZeroProofs));
      await tester.pumpAndSettle();

      expect(find.text('No documents on file. Tap "Edit Profile" above to upload verification documents.'), findsOneWidget);
    });

    testWidgets('edit mode enforces sole proof protection with feedback', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createProfileWidget(baseUserWithOneProof));
      await tester.pumpAndSettle();

      // Enter edit mode
      await tester.tap(find.text('Edit Profile'));
      await tester.pumpAndSettle();

      // Scroll down to identity section
      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -500));
      await tester.pumpAndSettle();

      // PhilSys document is on file. Attempting to remove sole proof triggers feedback
      final removeButton = find.byTooltip('Cannot remove: at least one proof must remain on file');
      expect(removeButton, findsOneWidget);

      await tester.tap(removeButton);
      await tester.pumpAndSettle();

      // Verify SnackBar warning explains requirement
      expect(
        find.text(
          'Cannot remove: residents must maintain at least one identity or residency proof document on file. You may replace this document instead.',
        ),
        findsOneWidget,
      );

      // Verify REPLACE button is present
      expect(find.text('REPLACE'), findsOneWidget);
    });

    testWidgets('cancelling edit mode resets all staged fields', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createProfileWidget(baseUserWithOneProof));
      await tester.pumpAndSettle();

      // Enter edit mode
      await tester.tap(find.text('Edit Profile'));
      await tester.pumpAndSettle();

      // Modify full name
      final nameField = find.widgetWithText(TextField, 'Maria Santos');
      await tester.enterText(nameField, 'Changed Temporary Name');

      // Tap Cancel
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      // Verify view mode restored with original name
      expect(find.text('Maria Santos'), findsOneWidget);
      expect(find.text('Changed Temporary Name'), findsNothing);
    });

    testWidgets('shows backend error snackbar when update fails', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      apiClient.mockStatusCode = 400;
      apiClient.mockResponseBody = {
        'verification_documents': [
          'Cannot remove the only proof document on file. Residents must maintain at least one valid identity or residency proof document.'
        ]
      };

      await tester.pumpWidget(createProfileWidget(userWithTwoProofs));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Edit Profile'));
      await tester.pumpAndSettle();

      // Scroll to Save Changes button
      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -600));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Save Changes'));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Cannot remove the only proof document on file. Residents must maintain at least one valid identity or residency proof document.',
        ),
        findsOneWidget,
      );
    });
  });
}
