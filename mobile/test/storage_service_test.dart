import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const accessTokenKey = 'gridy_access_token';
  const refreshCookieKey = 'gridy_refresh_cookie';
  const cachedUserKey = 'gridy_cached_user';
  const rememberMeKey = 'gridy_remember_me';
  const savedUsernameKey = 'gridy_saved_username';

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
  });

  test('migrates legacy tokens and removes their preference copies', () async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(accessTokenKey, 'legacy-access-token');
    await prefs.setString(
      refreshCookieKey,
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
    expect(prefs.getString(accessTokenKey), isNull);
    expect(prefs.getString(refreshCookieKey), isNull);
  });

  test('saves tokens securely and clears only the active session', () async {
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
    expect(prefs.getString(accessTokenKey), isNull);
    expect(prefs.getString(refreshCookieKey), isNull);

    await storage.clearSession();

    expect(storage.getAccessToken(), isNull);
    expect(storage.getRefreshCookie(), isNull);
    expect(await secureStorage.read(key: accessTokenKey), isNull);
    expect(await secureStorage.read(key: refreshCookieKey), isNull);
    expect(prefs.getString(cachedUserKey), isNull);
    expect(storage.isRememberMeEnabled(), isTrue);
    expect(storage.getSavedUsername(), 'resident.user');
  });

  test('clearAll removes secure tokens and all app preferences', () async {
    final prefs = await SharedPreferences.getInstance();
    final storage = await StorageService.init();
    const secureStorage = FlutterSecureStorage();

    await storage.saveTokens(
      accessToken: 'access-token-to-clear',
      refreshCookie: 'refresh_token=refresh-token-to-clear',
    );
    await storage.saveRememberMe(rememberMe: true, username: 'resident.user');

    await storage.clearAll();

    expect(storage.getAccessToken(), isNull);
    expect(storage.getRefreshCookie(), isNull);
    expect(await secureStorage.read(key: accessTokenKey), isNull);
    expect(await secureStorage.read(key: refreshCookieKey), isNull);
    expect(prefs.getBool(rememberMeKey), isNull);
    expect(prefs.getString(savedUsernameKey), isNull);
  });
}
