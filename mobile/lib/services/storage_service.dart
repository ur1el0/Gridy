import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_model.dart';

/// Manages secure session tokens and ordinary cached app preferences.
class StorageService {
  static const String _keyAccessToken = 'gridy_access_token';
  static const String _keyRefreshCookie = 'gridy_refresh_cookie';
  static const String _keyUser = 'gridy_cached_user';
  static const String _keyRememberMe = 'gridy_remember_me';
  static const String _keySavedUsername = 'gridy_saved_username';

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secureStorage;

  // Keep tokens in memory after loading them from secure storage.
  String? _accessToken;
  String? _refreshCookie;

  StorageService(this._prefs, {FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? FlutterSecureStorage();

  /// Initializes preferences and loads tokens before the app uses this service.
  static Future<StorageService> init({
    FlutterSecureStorage? secureStorage,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final secureStore = secureStorage ?? FlutterSecureStorage();
    final storage = StorageService(prefs, secureStorage: secureStore);

    storage._accessToken = await storage._readAndMigrateToken(_keyAccessToken);
    storage._refreshCookie = await storage._readAndMigrateToken(
      _keyRefreshCookie,
    );

    return storage;
  }

  /// Reads a secure token, migrating its old SharedPreferences value if needed.
  Future<String?> _readAndMigrateToken(String key) async {
    final secureValue = await _secureStorage.read(key: key);
    final legacyValue = _prefs.getString(key);

    if (secureValue != null && secureValue.isNotEmpty) {
      if (legacyValue != null) {
        await _prefs.remove(key);
      }
      return secureValue;
    }

    if (legacyValue == null || legacyValue.isEmpty) {
      if (legacyValue != null) {
        await _prefs.remove(key);
      }
      return null;
    }

    // Remove the plaintext copy only after the secure write succeeds.
    await _secureStorage.write(key: key, value: legacyValue);
    await _prefs.remove(key);
    return legacyValue;
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

  /// Caches non-secret authenticated user details in app preferences.
  Future<void> saveUser(UserModel user) async {
    final userJsonStr = jsonEncode(user.toJson());
    await _prefs.setString(_keyUser, userJsonStr);
  }

  /// Retrieves cached user details.
  UserModel? getUser() {
    final userJsonStr = _prefs.getString(_keyUser);
    if (userJsonStr == null || userJsonStr.isEmpty) {
      return null;
    }

    try {
      final Map<String, dynamic> userMap = jsonDecode(userJsonStr);
      return UserModel.fromJson(userMap);
    } catch (_) {
      return null;
    }
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

    try {
      await Future.wait<void>([
        _secureStorage.delete(key: _keyAccessToken),
        _secureStorage.delete(key: _keyRefreshCookie),
      ]);
    } finally {
      // Also remove any legacy plaintext copies and the cached user.
      await _prefs.remove(_keyAccessToken);
      await _prefs.remove(_keyRefreshCookie);
      await _prefs.remove(_keyUser);
    }
  }

  /// Clears all preferences and this service's secure session tokens.
  Future<void> clearAll() async {
    _accessToken = null;
    _refreshCookie = null;

    try {
      await Future.wait<void>([
        _secureStorage.delete(key: _keyAccessToken),
        _secureStorage.delete(key: _keyRefreshCookie),
      ]);
    } finally {
      await _prefs.clear();
    }
  }
}
