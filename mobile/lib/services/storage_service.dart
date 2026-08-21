import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

/// Service managing persistent storage for tokens, user profiles,
/// and login preferences.
class StorageService {
  static const String _keyAccessToken = 'gridy_access_token';
  static const String _keyRefreshCookie = 'gridy_refresh_cookie';
  static const String _keyUser = 'gridy_cached_user';
  static const String _keyRememberMe = 'gridy_remember_me';
  static const String _keySavedUsername = 'gridy_saved_username';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  /// Factory constructor to initialize with async shared preferences instance
  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  /// Save authentication tokens & session cookies
  Future<void> saveTokens({
    required String accessToken,
    String? refreshCookie,
  }) async {
    await _prefs.setString(_keyAccessToken, accessToken);
    if (refreshCookie != null && refreshCookie.isNotEmpty) {
      await _prefs.setString(_keyRefreshCookie, refreshCookie);
    }
  }

  /// Retrieve stored JWT access token
  String? getAccessToken() {
    return _prefs.getString(_keyAccessToken);
  }

  /// Retrieve stored session refresh cookie
  String? getRefreshCookie() {
    return _prefs.getString(_keyRefreshCookie);
  }

  /// Cache authenticated user details
  Future<void> saveUser(UserModel user) async {
    final userJsonStr = jsonEncode(user.toJson());
    await _prefs.setString(_keyUser, userJsonStr);
  }

  /// Retrieve cached user details
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

  /// Save "Remember Me" preference and username
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

  /// Check if "Remember Me" is enabled
  bool isRememberMeEnabled() {
    return _prefs.getBool(_keyRememberMe) ?? false;
  }

  /// Retrieve saved username for auto-fill
  String? getSavedUsername() {
    return _prefs.getString(_keySavedUsername);
  }

  /// Clear active session tokens and cached user data while respecting "Remember Me"
  Future<void> clearSession() async {
    await _prefs.remove(_keyAccessToken);
    await _prefs.remove(_keyRefreshCookie);
    await _prefs.remove(_keyUser);
  }

  /// Clear all stored application keys
  Future<void> clearAll() async {
    await _prefs.clear();
  }
}
