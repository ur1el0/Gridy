import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/models/auth_response.dart';
import 'package:mobile/models/user_model.dart';

void main() {
  group('UserModel Serialization & Deserialization', () {
    test('parses flat user JSON payload from /api/v1/auth/login/', () {
      final json = {
        'id': 101,
        'username': 'resident_juan',
        'email': 'juan@example.com',
        'role': 'RESIDENT',
        'full_name': 'Juan Dela Cruz',
      };

      final user = UserModel.fromJson(json);

      expect(user.id, 101);
      expect(user.username, 'resident_juan');
      expect(user.email, 'juan@example.com');
      expect(user.role, 'RESIDENT');
      expect(user.fullName, 'Juan Dela Cruz');
      expect(user.isResident, isTrue);
      expect(user.isOfficial, isFalse);
    });

    test('parses nested profile JSON payload from /api/v1/auth/me/', () {
      final json = {
        'id': 202,
        'username': 'official_maria',
        'email': 'maria@barangay.gov',
        'role': 'BARANGAY_OFFICIAL',
        'profile': {
          'id': 55,
          'full_name': 'Hon. Maria Santos',
          'birth_date': '1985-05-12',
          'voter_status': true,
          'contact_number': '09987654321',
          'purok': 'Purok 3',
          'is_verified': true,
        },
      };

      final user = UserModel.fromJson(json);

      expect(user.id, 202);
      expect(user.username, 'official_maria');
      expect(user.role, 'BARANGAY_OFFICIAL');
      expect(user.fullName, 'Hon. Maria Santos');
      expect(user.isVerified, isTrue);
      expect(user.contactNumber, '09987654321');
      expect(user.purok, 'Purok 3');
      expect(user.birthDate, '1985-05-12');
      expect(user.isResident, isFalse);
      expect(user.isOfficial, isTrue);
    });

    test('correctly identifies FIELD_OFFICIAL role and formatted role display', () {
      final json = {
        'id': 404,
        'username': 'tanod_pedro',
        'email': 'pedro@barangay.gov',
        'role': 'FIELD_OFFICIAL',
        'full_name': 'Pedro Penduko',
      };

      final user = UserModel.fromJson(json);

      expect(user.id, 404);
      expect(user.isResident, isFalse);
      expect(user.isOfficial, isTrue);
      expect(user.isFieldOfficial, isTrue);
      expect(user.roleDisplay, equals('Field Official / Tanod'));
    });
  });

  group('AuthResponse Parsing', () {
    test('parses access token, user, and extracted cookie header', () {
      final json = {
        'access': 'sample_jwt_access_token_123',
        'user': {
          'id': 1,
          'username': 'resident_juan',
          'email': 'juan@example.com',
          'role': 'RESIDENT',
          'full_name': 'Juan Dela Cruz',
        },
      };

      final authResponse = AuthResponse.fromJson(
        json,
        refreshCookie: 'refresh_token=rotated_jwt_cookie_456',
      );

      expect(authResponse.accessToken, 'sample_jwt_access_token_123');
      expect(authResponse.user.username, 'resident_juan');
      expect(authResponse.refreshCookie, 'refresh_token=rotated_jwt_cookie_456');
    });
  });

  group('ApiException Hierarchy', () {
    test('ValidationException correctly formats DRF serializer errors', () {
      final drfErrors = {
        'username': ['This field is required.'],
        'password': ['Password is too short.'],
      };

      final exception = ValidationException.fromDrfErrors(drfErrors);

      expect(exception.statusCode, 400);
      expect(exception.errors['username'], contains('This field is required.'));
      expect(exception.errors['password'], contains('Password is too short.'));
      expect(exception.message, contains('This field is required. Password is too short.'));
    });

    test('ForbiddenException preserves 403 status code and default verification message', () {
      const exception = ForbiddenException();
      expect(exception.statusCode, 403);
      expect(exception.message, contains('pending verification'));
    });

    test('UnauthorizedException preserves 401 status code', () {
      const exception = UnauthorizedException('Invalid credentials.');
      expect(exception.statusCode, 401);
      expect(exception.message, 'Invalid credentials.');
    });
  });
}
