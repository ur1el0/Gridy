import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'api_exception.dart';

/// Centralized HTTP client managing requests, headers, cookies, timeouts,
/// and error mapping for Gridy REST APIs.
class ApiClient {
  final http.Client _client;
  final String _baseUrl;
  String? _accessToken;
  String? _cookieHeader;

  ApiClient({
    http.Client? client,
    String? baseUrl,
  })  : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.baseUrl;

  String get baseUrl => _baseUrl;
  String? get accessToken => _accessToken;
  String? get cookieHeader => _cookieHeader;

  /// Update active in-memory tokens and cookies
  void setAuthCredentials({String? accessToken, String? cookieHeader}) {
    _accessToken = accessToken;
    if (cookieHeader != null) {
      _cookieHeader = cookieHeader;
    }
  }

  /// Clear stored credentials
  void clearAuthCredentials() {
    _accessToken = null;
    _cookieHeader = null;
  }

  /// Extracts the `refresh_token` or cookie string from response headers
  String? extractSetCookie(http.Response response) {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie == null || rawCookie.isEmpty) {
      return null;
    }
    // Extract name=value pairs before semicolons
    final cookies = rawCookie.split(',').map((c) => c.split(';').first.trim()).toList();
    return cookies.join('; ');
  }

  /// Perform a POST request
  Future<http.Response> post(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    bool requiresAuth = false,
  }) async {
    return _sendRequest(
      () => _client.post(
        _buildUri(endpoint),
        headers: _buildHeaders(headers, requiresAuth: requiresAuth),
        body: body != null ? jsonEncode(body) : null,
      ),
    );
  }

  /// Perform a GET request
  Future<http.Response> get(
    String endpoint, {
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      () => _client.get(
        _buildUri(endpoint, queryParams: queryParams),
        headers: _buildHeaders(headers, requiresAuth: requiresAuth),
      ),
    );
  }

  /// Perform a PUT request
  Future<http.Response> put(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      () => _client.put(
        _buildUri(endpoint),
        headers: _buildHeaders(headers, requiresAuth: requiresAuth),
        body: body != null ? jsonEncode(body) : null,
      ),
    );
  }

  /// Perform a PATCH request
  Future<http.Response> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      () => _client.patch(
        _buildUri(endpoint),
        headers: _buildHeaders(headers, requiresAuth: requiresAuth),
        body: body != null ? jsonEncode(body) : null,
      ),
    );
  }

  /// Perform a DELETE request
  Future<http.Response> delete(
    String endpoint, {
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      () => _client.delete(
        _buildUri(endpoint),
        headers: _buildHeaders(headers, requiresAuth: requiresAuth),
      ),
    );
  }

  /// Constructs the full URI with optional query parameters
  Uri _buildUri(String endpoint, {Map<String, String>? queryParams}) {
    final cleanBase = _baseUrl.endsWith('/')
        ? _baseUrl.substring(0, _baseUrl.length - 1)
        : _baseUrl;
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final fullUrl = '$cleanBase$cleanEndpoint';

    final uri = Uri.parse(fullUrl);
    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(queryParameters: queryParams);
    }
    return uri;
  }

  /// Prepares standard request headers
  Map<String, String> _buildHeaders(
    Map<String, String>? customHeaders, {
    bool requiresAuth = false,
  }) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth && _accessToken != null && _accessToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }

    if (_cookieHeader != null && _cookieHeader!.isNotEmpty) {
      headers['Cookie'] = _cookieHeader!;
    }

    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }

    return headers;
  }

  /// Executes request with timeout and maps network/HTTP status errors
  Future<http.Response> _sendRequest(
    Future<http.Response> Function() requestFn,
  ) async {
    try {
      final response = await requestFn().timeout(AppConfig.requestTimeout);

      // Check if response indicates success (2xx)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
      }

      // Handle HTTP error statuses
      _handleHttpError(response);
      return response;
    } on SocketException catch (_) {
      throw const NetworkException();
    } on TimeoutException catch (_) {
      throw const NetworkException(
        'Request timed out. Please verify the server is reachable.',
      );
    } on http.ClientException catch (_) {
      throw const NetworkException();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Unexpected network error: $e');
    }
  }

  /// Parses error responses from Django Rest Framework
  void _handleHttpError(http.Response response) {
    dynamic decodedBody;
    try {
      if (response.body.isNotEmpty) {
        decodedBody = jsonDecode(utf8.decode(response.bodyBytes));
      }
    } catch (_) {
      decodedBody = null;
    }

    String? detailMessage;
    if (decodedBody is Map<String, dynamic>) {
      if (decodedBody.containsKey('detail')) {
        detailMessage = decodedBody['detail']?.toString();
      } else if (decodedBody.containsKey('error')) {
        detailMessage = decodedBody['error']?.toString();
      } else if (decodedBody.containsKey('message')) {
        detailMessage = decodedBody['message']?.toString();
      }
    }

    switch (response.statusCode) {
      case 400:
        if (decodedBody is Map<String, dynamic>) {
          throw ValidationException.fromDrfErrors(decodedBody);
        }
        throw ValidationException(
          detailMessage ?? 'Bad request. Please check submitted data.',
          details: decodedBody,
        );

      case 401:
        throw UnauthorizedException(
          detailMessage ?? 'Invalid credentials or session expired.',
          decodedBody,
        );

      case 403:
        throw ForbiddenException(
          detailMessage ?? 'Access forbidden. Verification required.',
          decodedBody,
        );

      case 404:
        throw NotFoundException(
          detailMessage ?? 'Requested resource was not found.',
          decodedBody,
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw ApiException(
          detailMessage ?? 'Server error occurred (${response.statusCode}). Please try again later.',
          statusCode: response.statusCode,
          details: decodedBody,
        );

      default:
        throw ApiException(
          detailMessage ?? 'Request failed with status code ${response.statusCode}.',
          statusCode: response.statusCode,
          details: decodedBody,
        );
    }
  }
}
