import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/network/api_exception.dart';

void main() {
  test(
    'waits for token persistence before accepting refreshed credentials',
    () async {
      final callbackStarted = Completer<void>();
      final allowPersistenceToFinish = Completer<void>();

      final mockClient = MockClient(
        (_) async => http.Response(
          '{"access":"fresh-access-token"}',
          200,
          headers: {
            'set-cookie':
                'refresh_token=fresh-refresh-token; HttpOnly; Path=/; SameSite=Strict',
          },
        ),
      );
      addTearDown(mockClient.close);

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'https://example.test',
      );
      apiClient.setAuthCredentials(
        accessToken: 'old-access-token',
        cookieHeader: 'refresh_token=old-refresh-token',
      );

      apiClient.onTokenRefreshed = (newAccessToken, newCookieHeader) async {
        expect(newAccessToken, 'fresh-access-token');
        expect(newCookieHeader, 'refresh_token=fresh-refresh-token');

        callbackStarted.complete();
        await allowPersistenceToFinish.future;
      };

      final refreshFuture = apiClient.refreshAccessToken();
      await callbackStarted.future;

      // The refresh must not replace the active token before persistence finishes.
      expect(apiClient.accessToken, 'old-access-token');

      allowPersistenceToFinish.complete();

      expect(await refreshFuture, isTrue);
      expect(apiClient.accessToken, 'fresh-access-token');
      expect(apiClient.cookieHeader, 'refresh_token=fresh-refresh-token');
    },
  );

  test('keeps existing credentials if token persistence fails', () async {
    final mockClient = MockClient(
      (_) async => http.Response(
        '{"access":"fresh-access-token"}',
        200,
        headers: {
          'set-cookie':
              'refresh_token=fresh-refresh-token; HttpOnly; Path=/; SameSite=Strict',
        },
      ),
    );
    addTearDown(mockClient.close);

    final apiClient = ApiClient(
      client: mockClient,
      baseUrl: 'https://example.test',
    );
    apiClient.setAuthCredentials(
      accessToken: 'old-access-token',
      cookieHeader: 'refresh_token=old-refresh-token',
    );

    apiClient.onTokenRefreshed = (newAccessToken, newCookieHeader) async {
      throw StateError('Secure token persistence failed');
    };

    expect(await apiClient.refreshAccessToken(), isFalse);
    expect(apiClient.accessToken, 'old-access-token');
    expect(apiClient.cookieHeader, 'refresh_token=old-refresh-token');
  });

  test('does not expose unexpected exception details in API errors', () async {
    final mockClient = MockClient(
      (_) async => throw StateError('private server path and credentials'),
    );
    addTearDown(mockClient.close);

    final apiClient = ApiClient(
      client: mockClient,
      baseUrl: 'https://example.test',
    );

    await expectLater(
      apiClient.get('/health/', requiresAuth: false),
      throwsA(
        isA<ApiException>().having(
          (error) => error.message,
          'message',
          'The request failed. Please try again.',
        ),
      ),
    );
  });

  test('does not return server exception details in API errors', () async {
    final mockClient = MockClient(
      (_) async =>
          http.Response('{"detail":"private traceback and credentials"}', 500),
    );
    addTearDown(mockClient.close);

    final apiClient = ApiClient(
      client: mockClient,
      baseUrl: 'https://example.test',
    );

    await expectLater(
      apiClient.get('/health/', requiresAuth: false),
      throwsA(
        isA<ApiException>().having(
          (error) => error.message,
          'message',
          'The service could not complete this request. Please try again.',
        ),
      ),
    );
  });
}
