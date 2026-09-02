import '../core/network/api_exception.dart';
import 'dart:convert';
import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';
import 'storage_service.dart';

/// Authentication service coordinating login, session renewal, user profiles,
/// and local storage synchronization.
class AuthService {
  final ApiClient apiClient;
  final StorageService storageService;

  AuthService({
    required this.apiClient,
    required this.storageService,
  }) {
    // Restore session credentials into ApiClient on startup
    final token = storageService.getAccessToken();
    final cookie = storageService.getRefreshCookie();
    if (token != null || cookie != null) {
      apiClient.setAuthCredentials(
        accessToken: token,
        cookieHeader: cookie,
      );
    }
  }

  /// Authenticate against Django backend `/api/v1/auth/login/`
  Future<AuthResponse> login({
    required String username,
    required String password,
  }) async {
    final response = await apiClient.post(
      AppConfig.loginEndpoint,
      body: {
        'username': username.trim(),
        'password': password,
      },
      requiresAuth: false,
    );

    final Map<String, dynamic> responseData = jsonDecode(
      utf8.decode(response.bodyBytes),
    );

    // Extract cookie from Set-Cookie header (if server returned one)
    final cookieHeader = apiClient.extractSetCookie(response);

    // Construct strongly-typed auth response
    final authResponse = AuthResponse.fromJson(
      responseData,
      refreshCookie: cookieHeader,
    );

    // Persist credentials in local storage
    await storageService.saveTokens(
      accessToken: authResponse.accessToken,
      refreshCookie: cookieHeader,
    );
    await storageService.saveUser(authResponse.user);

    // Update active in-memory headers in ApiClient
    apiClient.setAuthCredentials(
      accessToken: authResponse.accessToken,
      cookieHeader: cookieHeader,
    );

    return authResponse;
  }

  /// Register a new resident account against Django backend `/api/v1/auth/register/`
  Future<UserModel> register({
    required String fullName,
    required String username,
    required String email,
    required String password,
    required String birthDate,
    required bool voterStatus,
    String? contactNumber,
  }) async {
    final response = await apiClient.post(
      AppConfig.registerEndpoint,
      body: {
        'full_name': fullName.trim(),
        'username': username.trim(),
        'email': email.trim().toLowerCase(),
        'password': password,
        'birth_date': birthDate,
        'voter_status': voterStatus,
        if (contactNumber != null && contactNumber.isNotEmpty)
          'contact_number': contactNumber.trim(),
      },
      requiresAuth: false,
    );

    final Map<String, dynamic> responseData = jsonDecode(
      utf8.decode(response.bodyBytes),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return UserModel.fromJson(responseData);
    } else {
      throw ApiException(
        'Registration failed',
        statusCode: response.statusCode,
        details: responseData,
      );
    }
  }
  /// Fetch currently authenticated resident profile `/api/v1/auth/me/`
  Future<UserModel> updateProfile({
    String? fullName,
    String? contactNumber,
    String? birthDate,
    bool? voterStatus,
  }) async {
    final Map<String, dynamic> profileData = {};
    if (fullName != null) profileData['full_name'] = fullName;
    if (contactNumber != null) profileData['contact_number'] = contactNumber;
    if (birthDate != null) profileData['birth_date'] = birthDate;
    if (voterStatus != null) profileData['voter_status'] = voterStatus;
    final response = await apiClient.patch(
      AppConfig.userProfileEndpoint,
      body: {'profile': profileData},
      requiresAuth: true,
    );
    final Map<String, dynamic> responseData = jsonDecode(
      utf8.decode(response.bodyBytes),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final updatedUser = UserModel.fromJson(responseData);
      await storageService.saveUser(updatedUser);
      return updatedUser;
    } else {
      throw ApiException(
        'Failed to update profile',
        statusCode: response.statusCode,
        details: responseData,
      );
    }
  }

  /// Renew expired JWT access token using the backend refresh endpoint
  Future<String?> refreshToken() async {
    final refreshCookie = storageService.getRefreshCookie();
    if (refreshCookie == null || refreshCookie.isEmpty) {
      return null;
    }

    try {
      final response = await apiClient.post(
        AppConfig.tokenRefreshEndpoint,
        headers: {'Cookie': refreshCookie},
        requiresAuth: false,
      );

      final Map<String, dynamic> responseData = jsonDecode(
        utf8.decode(response.bodyBytes),
      );

      final newAccessToken = responseData['access'] as String?;
      final newCookieHeader = apiClient.extractSetCookie(response) ?? refreshCookie;

      if (newAccessToken != null) {
        await storageService.saveTokens(
          accessToken: newAccessToken,
          refreshCookie: newCookieHeader,
        );
        apiClient.setAuthCredentials(
          accessToken: newAccessToken,
          cookieHeader: newCookieHeader,
        );
        return newAccessToken;
      }
    } catch (_) {
      // Refresh failed (cookie expired or revoked)
      await logout();
    }
    return null;
  }

  /// Terminate the active session on both the backend and local storage
  Future<void> logout() async {
    try {
      final cookie = storageService.getRefreshCookie();
      if (cookie != null && cookie.isNotEmpty) {
        await apiClient.post(
          AppConfig.logoutEndpoint,
          headers: {'Cookie': cookie},
          requiresAuth: false,
        );
      }
    } catch (_) {
      // Silently proceed with local cleanup even if network fails
    } finally {
      await storageService.clearSession();
      apiClient.clearAuthCredentials();
    }
  }

  /// Check if user has an active stored token
  bool isAuthenticated() {
    final token = storageService.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  /// Retrieve cached user profile
  UserModel? getCurrentUser() {
    return storageService.getUser();
  }

  /// Request a password reset email/token for the given registered email
  Future<void> requestPasswordReset(String email) async {
    await apiClient.post(
      '/auth/password-reset/',
      body: {'email': email.trim().toLowerCase()},
      requiresAuth: false,
    );
  }

  /// Confirm password reset using the token, UID, and new password
  Future<void> confirmPasswordReset({
    required String newPassword,
    required String uidb64,
    required String token,
  }) async {
    await apiClient.post(
      '/auth/password-reset/confirm/',
      body: {
        'new_password': newPassword,
        'uidb64': uidb64,
        'token': token,
      },
      requiresAuth: false,
    );
  }
}