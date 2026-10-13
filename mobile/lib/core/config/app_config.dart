import 'package:flutter/foundation.dart';

/// Central application configuration providing platform-aware networking
/// and API endpoint constants.
class AppConfig {
  AppConfig._();

  /// Canonical production backend API base URL for deployed environments.
  static const String productionBaseUrl =
      'https://gridy-backend.onrender.com/api/v1';

  /// Configurable base URL defined at build time with `--dart-define=API_BASE_URL=...`
  /// or fallback according to running target platform.
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Resolves the backend base URL given environment configuration,
  /// build mode, and target platform.
  ///
  /// - In release mode ([isReleaseMode] == true), an HTTPS endpoint is required.
  ///   If no build-time override is provided, it defaults to [productionBaseUrl].
  ///   Cleartext HTTP (`http://`) is strictly prohibited in release mode.
  /// - In debug/profile mode ([isReleaseMode] == false), build-time overrides take
  ///   precedence. Otherwise, local emulator/simulator addresses are used:
  ///   Android emulators route localhost through `10.0.2.2`, while Web, iOS,
  ///   and desktop environments route via `127.0.0.1`.
  static String resolveBaseUrl({
    String? envBaseUrl,
    bool isReleaseMode = kReleaseMode,
    TargetPlatform? platform,
    bool isWeb = kIsWeb,
  }) {
    final effectiveEnv = (envBaseUrl ?? _envBaseUrl).trim();

    if (isReleaseMode) {
      final candidate = effectiveEnv.isNotEmpty ? effectiveEnv : productionBaseUrl;
      final uri = Uri.tryParse(candidate);
      if (uri == null || uri.scheme != 'https') {
        throw StateError(
          'Release builds require an HTTPS API base URL. Cleartext HTTP is prohibited: $candidate',
        );
      }
      return candidate;
    }

    if (effectiveEnv.isNotEmpty) {
      return effectiveEnv;
    }

    if (isWeb) {
      return 'http://127.0.0.1:8000/api/v1';
    }

    final effectivePlatform = platform ?? defaultTargetPlatform;
    switch (effectivePlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:8000/api/v1';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return 'http://127.0.0.1:8000/api/v1';
    }
  }

  /// Resolves the default backend base URL depending on target platform and build mode.
  static String get defaultBaseUrl => resolveBaseUrl();

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
