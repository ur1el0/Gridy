import 'package:flutter/foundation.dart';

/// Central application configuration providing platform-aware networking
/// and API endpoint constants.
class AppConfig {
  AppConfig._();

  /// Configurable base URL defined at build time with `--dart-define=API_BASE_URL=...`
  /// or fallback according to running target platform.
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Resolves the default backend base URL depending on target platform.
  /// Android emulators route localhost through `10.0.2.2`.
  /// iOS simulators, Web, and Desktop environments route via `127.0.0.1`.
  static String get defaultBaseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl;
    }

    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api/v1';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://127.0.0.1:8000/api/v1';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return 'http://127.0.0.1:8000/api/v1';
    }
  }

  /// Dynamic API Base URL allowing runtime overriding if necessary
  static String baseUrl = defaultBaseUrl;

  // Authentication endpoints
  static const String loginEndpoint = '/auth/login/';
  static const String tokenRefreshEndpoint = '/auth/token/refresh/';
  static const String logoutEndpoint = '/auth/logout/';
  static const String userProfileEndpoint = '/auth/me/';
  static const String registerEndpoint = '/auth/register/';

  // Request timeout
  static const Duration requestTimeout = Duration(seconds: 15);
}
