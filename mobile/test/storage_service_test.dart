import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const accessTokenKey = 'kapitbayan_access_token';
  const refreshCookieKey = 'kapitbayan_refresh_cookie';
  const cachedUserKey = 'kapitbayan_cached_user';
  const rememberMeKey = 'kapitbayan_remember_me';
  const savedUsernameKey = 'kapitbayan_saved_username';
  const legacyAccessTokenKey = 'gridy_access_token';
  const legacyRefreshCookieKey = 'gridy_refresh_cookie';
  const legacyCachedUserKey = 'gridy_cached_user';
  const legacyRememberMeKey = 'gridy_remember_me';
  const legacySavedUsernameKey = 'gridy_saved_username';

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
  });

  test('migrates legacy preference tokens to secure KapitBayan keys', () async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(legacyAccessTokenKey, 'legacy-access-token');
    await prefs.setString(
      legacyRefreshCookieKey,
      'refresh_token=legacy-refresh-token',
    );

    final storage = await StorageService.init();
    const secureStorage = FlutterSecureStorage();

    expect(storage.getAccessToken(), 'legacy-access-token');
    expect(storage.getRefreshCookie(), 'refresh_token=legacy-refresh-token');
    expect(
      await secureStorage.read(key: accessTokenKey),
      'legacy-access-token',
    );
    expect(
      await secureStorage.read(key: refreshCookieKey),
      'refresh_token=legacy-refresh-token',
    );
    expect(await secureStorage.read(key: legacyAccessTokenKey), isNull);
    expect(await secureStorage.read(key: legacyRefreshCookieKey), isNull);
    expect(prefs.getString(legacyAccessTokenKey), isNull);
    expect(prefs.getString(legacyRefreshCookieKey), isNull);
    expect(prefs.getString(accessTokenKey), isNull);
    expect(prefs.getString(refreshCookieKey), isNull);
  });

  test('migrates secure legacy tokens before removing old copies', () async {
    FlutterSecureStorage.setMockInitialValues({
      legacyAccessTokenKey: 'secure-legacy-access',
      legacyRefreshCookieKey: 'refresh_token=secure-legacy-refresh',
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(legacyAccessTokenKey, 'stale-plain-access');
    await prefs.setString(legacyRefreshCookieKey, 'stale-plain-refresh');

    final storage = await StorageService.init();
    const secureStorage = FlutterSecureStorage();

    expect(storage.getAccessToken(), 'secure-legacy-access');
    expect(storage.getRefreshCookie(), 'refresh_token=secure-legacy-refresh');
    expect(
      await secureStorage.read(key: accessTokenKey),
      'secure-legacy-access',
    );
    expect(
      await secureStorage.read(key: refreshCookieKey),
      'refresh_token=secure-legacy-refresh',
    );
    expect(await secureStorage.read(key: legacyAccessTokenKey), isNull);
    expect(await secureStorage.read(key: legacyRefreshCookieKey), isNull);
    expect(prefs.getString(legacyAccessTokenKey), isNull);
    expect(prefs.getString(legacyRefreshCookieKey), isNull);
  });

  test('new secure token values take precedence over legacy values', () async {
    FlutterSecureStorage.setMockInitialValues({
      accessTokenKey: 'current-access-token',
      legacyAccessTokenKey: 'older-access-token',
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(rememberMeKey, false);
    await prefs.setBool(legacyRememberMeKey, true);

    final firstStorage = await StorageService.init();
    final secondStorage = await StorageService.init();
    const secureStorage = FlutterSecureStorage();

    expect(firstStorage.getAccessToken(), 'current-access-token');
    expect(secondStorage.getAccessToken(), 'current-access-token');
    expect(await secureStorage.read(key: legacyAccessTokenKey), isNull);
    expect(prefs.getBool(rememberMeKey), isFalse);
    expect(prefs.getBool(legacyRememberMeKey), isNull);
  });

  test(
    'migrates cached user and login preferences without losing values',
    () async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(legacyCachedUserKey, '{"cached":"user"}');
      await prefs.setBool(legacyRememberMeKey, true);
      await prefs.setString(legacySavedUsernameKey, 'resident.user');

      final storage = await StorageService.init();

      expect(prefs.getString(cachedUserKey), '{"cached":"user"}');
      expect(prefs.getBool(rememberMeKey), isTrue);
      expect(prefs.getString(savedUsernameKey), 'resident.user');
      expect(prefs.getString(legacyCachedUserKey), isNull);
      expect(prefs.getBool(legacyRememberMeKey), isNull);
      expect(prefs.getString(legacySavedUsernameKey), isNull);
      expect(storage.isRememberMeEnabled(), isTrue);
      expect(storage.getSavedUsername(), 'resident.user');
    },
  );

  test('retains legacy preferences when a destination write fails', () async {
    final prefs = _FailingWriteSharedPreferences({
      legacyCachedUserKey: '{"cached":"user"}',
      legacyRememberMeKey: true,
      legacySavedUsernameKey: 'resident.user',
    });

    await StorageService.init(preferences: prefs);

    expect(prefs.getString(legacyCachedUserKey), '{"cached":"user"}');
    expect(prefs.getBool(legacyRememberMeKey), isTrue);
    expect(prefs.getString(legacySavedUsernameKey), 'resident.user');
    expect(prefs.containsKey(cachedUserKey), isFalse);
    expect(prefs.containsKey(rememberMeKey), isFalse);
    expect(prefs.containsKey(savedUsernameKey), isFalse);
  });

  test('saves new keys and clears only active session data', () async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(cachedUserKey, '{"cached":"user"}');

    final storage = await StorageService.init();
    const secureStorage = FlutterSecureStorage();

    await storage.saveTokens(
      accessToken: 'new-access-token',
      refreshCookie: 'refresh_token=new-refresh-token',
    );
    await storage.saveRememberMe(rememberMe: true, username: 'resident.user');

    expect(storage.getAccessToken(), 'new-access-token');
    expect(storage.getRefreshCookie(), 'refresh_token=new-refresh-token');
    expect(await secureStorage.read(key: accessTokenKey), 'new-access-token');
    expect(await secureStorage.read(key: legacyAccessTokenKey), isNull);
    expect(prefs.getString(accessTokenKey), isNull);

    await storage.clearSession();

    expect(storage.getAccessToken(), isNull);
    expect(storage.getRefreshCookie(), isNull);
    expect(await secureStorage.read(key: accessTokenKey), isNull);
    expect(await secureStorage.read(key: refreshCookieKey), isNull);
    expect(await secureStorage.read(key: legacyAccessTokenKey), isNull);
    expect(await secureStorage.read(key: legacyRefreshCookieKey), isNull);
    expect(prefs.getString(cachedUserKey), isNull);
    expect(prefs.getString(legacyCachedUserKey), isNull);
    expect(storage.isRememberMeEnabled(), isTrue);
    expect(storage.getSavedUsername(), 'resident.user');
  });

  test('clearAll removes both key namespaces and app preferences', () async {
    final prefs = await SharedPreferences.getInstance();
    final storage = await StorageService.init();
    const secureStorage = FlutterSecureStorage();

    await storage.saveTokens(
      accessToken: 'access-token-to-clear',
      refreshCookie: 'refresh_token=refresh-token-to-clear',
    );
    await secureStorage.write(
      key: legacyAccessTokenKey,
      value: 'legacy-access-token-to-clear',
    );
    await storage.saveRememberMe(rememberMe: true, username: 'resident.user');

    await storage.clearAll();

    expect(storage.getAccessToken(), isNull);
    expect(storage.getRefreshCookie(), isNull);
    expect(await secureStorage.read(key: accessTokenKey), isNull);
    expect(await secureStorage.read(key: refreshCookieKey), isNull);
    expect(await secureStorage.read(key: legacyAccessTokenKey), isNull);
    expect(await secureStorage.read(key: legacyRefreshCookieKey), isNull);
    expect(prefs.getBool(rememberMeKey), isNull);
    expect(prefs.getString(savedUsernameKey), isNull);
  });
}

class _FailingWriteSharedPreferences implements SharedPreferences {
  _FailingWriteSharedPreferences(this.values);

  final Map<String, Object> values;

  @override
  bool containsKey(String key) => values.containsKey(key);

  @override
  bool? getBool(String key) => values[key] as bool?;

  @override
  String? getString(String key) => values[key] as String?;

  @override
  Future<bool> remove(String key) async {
    values.remove(key);
    return true;
  }

  @override
  Future<bool> setBool(String key, bool value) async => false;

  @override
  Future<bool> setString(String key, String value) async => false;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
