import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_model.dart';

/// Manages secure session tokens and cached authenticated user details.
class StorageService {
  static const String _keyAccessToken = 'kapitbayan_access_token';
  static const String _keyRefreshCookie = 'kapitbayan_refresh_cookie';
  static const String _keyUser = 'kapitbayan_cached_user';
  static const String _keyRememberMe = 'kapitbayan_remember_me';
  static const String _keySavedUsername = 'kapitbayan_saved_username';

  static const String _legacyKeyAccessToken = 'gridy_access_token';
  static const String _legacyKeyRefreshCookie = 'gridy_refresh_cookie';
  static const String _legacyKeyUser = 'gridy_cached_user';
  static const String _legacyKeyRememberMe = 'gridy_remember_me';
  static const String _legacyKeySavedUsername = 'gridy_saved_username';

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secureStorage;

  // Keep tokens in memory after loading them from secure storage.
  String? _accessToken;
  String? _refreshCookie;
  UserModel? _cachedUser;

  StorageService(this._prefs, {FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? FlutterSecureStorage();

  /// Initializes preferences and loads tokens before the app uses this service.
  static Future<StorageService> init({
    FlutterSecureStorage? secureStorage,
    SharedPreferences? preferences,
  }) async {
    final prefs = preferences ?? await SharedPreferences.getInstance();
    final secureStore = secureStorage ?? FlutterSecureStorage();
    final storage = StorageService(prefs, secureStorage: secureStore);

    storage._accessToken = await storage._readAndMigrateToken(
      _keyAccessToken,
      _legacyKeyAccessToken,
    );
    storage._refreshCookie = await storage._readAndMigrateToken(
      _keyRefreshCookie,
      _legacyKeyRefreshCookie,
    );
    await storage._loadAndMigrateCachedUser();
    await storage._migrateBoolPreference(_keyRememberMe, _legacyKeyRememberMe);
    await storage._migrateStringPreference(
      _keySavedUsername,
      _legacyKeySavedUsername,
    );

    return storage;
  }

  /// Reads current or legacy token storage and migrates it into the new key.
  /// The source value is retained until the secure write succeeds.
  Future<String?> _readAndMigrateToken(String key, String legacyKey) async {
    final secureValue = await _secureStorage.read(key: key);
    if (secureValue != null && secureValue.isNotEmpty) {
      await _removeLegacyTokenCopies(key, legacyKey);
      return secureValue;
    }

    final currentPreference = _prefs.getString(key);
    final legacySecureValue = await _secureStorage.read(key: legacyKey);
    final legacyPreference = _prefs.getString(legacyKey);
    final value = _firstNonEmpty([
      legacySecureValue,
      currentPreference,
      legacyPreference,
    ]);

    if (value == null) {
      await _removeLegacyTokenCopies(key, legacyKey);
      return null;
    }

    await _secureStorage.write(key: key, value: value);
    await _removeLegacyTokenCopies(key, legacyKey);
    return value;
  }

  String? _firstNonEmpty(Iterable<String?> values) {
    for (final value in values) {
      if (value != null && value.isNotEmpty) return value;
    }
    return null;
  }

  Future<void> _removeLegacyTokenCopies(String key, String legacyKey) async {
    await _secureStorage.delete(key: legacyKey);
    await _prefs.remove(key);
    await _prefs.remove(legacyKey);
  }

  Future<void> _migrateStringPreference(String key, String legacyKey) async {
    if (!_prefs.containsKey(key)) {
      final legacyValue = _prefs.getString(legacyKey);
      if (legacyValue != null) {
        final saved = await _prefs.setString(key, legacyValue);
        if (!saved) return;
      }
    }
    await _prefs.remove(legacyKey);
  }

  Future<void> _migrateBoolPreference(String key, String legacyKey) async {
    if (!_prefs.containsKey(key)) {
      final legacyValue = _prefs.getBool(legacyKey);
      if (legacyValue != null) {
        final saved = await _prefs.setBool(key, legacyValue);
        if (!saved) return;
      }
    }
    await _prefs.remove(legacyKey);
  }

  /// Loads the encrypted user cache and migrates any old preference copies.
  /// A legacy copy remains in place if the secure write fails so a later
  /// startup can retry without silently losing the offline cache.
  Future<void> _loadAndMigrateCachedUser() async {
    final secureJson = await _secureStorage.read(key: _keyUser);
    final secureUser = _decodeUser(secureJson);
    if (secureUser != null) {
      _cachedUser = secureUser;
      await _removePlaintextUserCopies();
      return;
    }

    if (secureJson != null) {
      await _secureStorage.delete(key: _keyUser);
    }

    final preferenceJson =
        _prefs.getString(_keyUser) ?? _prefs.getString(_legacyKeyUser);
    final legacyUser = _decodeUser(preferenceJson);
    if (legacyUser == null || preferenceJson == null) {
      await _removePlaintextUserCopies();
      return;
    }

    try {
      // Keep the plaintext source until the encrypted copy is safely stored.
      await _secureStorage.write(key: _keyUser, value: preferenceJson);
    } catch (_) {
      // Leave the migration source intact for a retry on the next startup.
      return;
    }

    _cachedUser = legacyUser;
    try {
      await _removePlaintextUserCopies();
    } catch (_) {
      // The encrypted copy is valid; a later startup can retry cleanup.
    }
  }

  UserModel? _decodeUser(String? userJson) {
    if (userJson == null || userJson.isEmpty) return null;
    try {
      final decoded = jsonDecode(userJson);
      if (decoded is! Map<String, dynamic>) return null;
      return UserModel.fromJson(decoded);
    } catch (_) {
      return null;
    }
  }

  Future<void> _removePlaintextUserCopies() async {
    await _prefs.remove(_keyUser);
    await _prefs.remove(_legacyKeyUser);
  }

  /// Saves authentication tokens to secure storage.
  Future<void> saveTokens({
    required String accessToken,
    String? refreshCookie,
  }) async {
    await _secureStorage.write(key: _keyAccessToken, value: accessToken);
    _accessToken = accessToken;

    if (refreshCookie != null && refreshCookie.isNotEmpty) {
      await _secureStorage.write(key: _keyRefreshCookie, value: refreshCookie);
      _refreshCookie = refreshCookie;
    }
  }

  /// Returns the access token loaded into memory at initialization.
  String? getAccessToken() {
    return _accessToken;
  }

  /// Returns the refresh cookie loaded into memory at initialization.
  String? getRefreshCookie() {
    return _refreshCookie;
  }

  /// Stores authenticated user details in platform-encrypted secure storage.
  Future<void> saveUser(UserModel user) async {
    final userJsonStr = jsonEncode(user.toJson());
    await _secureStorage.write(key: _keyUser, value: userJsonStr);
    _cachedUser = user;
    await _removePlaintextUserCopies();
  }

  /// Retrieves user details loaded from encrypted storage at startup.
  UserModel? getUser() {
    return _cachedUser;
  }

  /// Saves the "Remember Me" preference and username.
  Future<void> saveRememberMe({
    required bool rememberMe,
    String? username,
  }) async {
    await _prefs.setBool(_keyRememberMe, rememberMe);

    if (rememberMe && username != null && username.isNotEmpty) {
      await _prefs.setString(_keySavedUsername, username);
    } else if (!rememberMe) {
      await _prefs.remove(_keySavedUsername);
    }
  }

  /// Checks whether "Remember Me" is enabled.
  bool isRememberMeEnabled() {
    return _prefs.getBool(_keyRememberMe) ?? false;
  }

  /// Retrieves the saved username for login autofill.
  String? getSavedUsername() {
    return _prefs.getString(_keySavedUsername);
  }

  /// Clears session tokens and cached user details while keeping login preferences.
  Future<void> clearSession() async {
    _accessToken = null;
    _refreshCookie = null;
    _cachedUser = null;

    try {
      await Future.wait<void>([
        _secureStorage.delete(key: _keyAccessToken),
        _secureStorage.delete(key: _keyRefreshCookie),
        _secureStorage.delete(key: _legacyKeyAccessToken),
        _secureStorage.delete(key: _legacyKeyRefreshCookie),
        _secureStorage.delete(key: _keyUser),
      ]);
    } finally {
      // Also remove plaintext copies in both namespaces and cached user data.
      await _prefs.remove(_keyAccessToken);
      await _prefs.remove(_keyRefreshCookie);
      await _prefs.remove(_keyUser);
      await _prefs.remove(_legacyKeyAccessToken);
      await _prefs.remove(_legacyKeyRefreshCookie);
      await _prefs.remove(_legacyKeyUser);
    }
  }

  /// Clears all preferences and this service's secure session tokens.
  Future<void> clearAll() async {
    _accessToken = null;
    _refreshCookie = null;
    _cachedUser = null;

    try {
      await Future.wait<void>([
        _secureStorage.delete(key: _keyAccessToken),
        _secureStorage.delete(key: _keyRefreshCookie),
        _secureStorage.delete(key: _legacyKeyAccessToken),
        _secureStorage.delete(key: _legacyKeyRefreshCookie),
        _secureStorage.delete(key: _keyUser),
      ]);
    } finally {
      await _prefs.clear();
    }
  }
}
