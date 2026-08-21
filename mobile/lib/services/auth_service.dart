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
    bool rememberMe = false,
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

    // Save or clear Remember Me username
    await storageService.saveRememberMe(
      rememberMe: rememberMe,
      username: username.trim(),
    );

    // Update active in-memory headers in ApiClient
    apiClient.setAuthCredentials(
      accessToken: authResponse.accessToken,
      cookieHeader: cookieHeader,
    );

    return authResponse;
  }

  /// Fetch currently authenticated resident profile `/api/v1/auth/me/`
  Future<UserModel> getProfile() async {
    final response = await apiClient.get(
      AppConfig.userProfileEndpoint,
      requiresAuth: true,
    );

    final Map<String, dynamic> responseData = jsonDecode(
      utf8.decode(response.bodyBytes),
    );

    final user = UserModel.fromJson(responseData);
    await storageService.saveUser(user);
    return user;
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

  /// Retrieve remembered username for login auto-fill
  String? getSavedUsername() {
    return storageService.getSavedUsername();
  }

  /// Retrieve Remember Me checkbox state
  bool isRememberMeEnabled() {
    return storageService.isRememberMeEnabled();
  }
}
