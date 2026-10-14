import 'dart:convert';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../models/navigator_model.dart';

/// Service interfacing with the tenant-scoped Public Information AI Navigator.
/// Endpoint: /api/v1/public/navigator/query/
/// Strictly delegates all authentication and tenant isolation to the server backend.
/// Never calls Gemini directly and contains zero provider API keys.
class NavigatorService {
  final ApiClient apiClient;

  NavigatorService({required this.apiClient});

  /// Submits a single-turn resident query to the navigator endpoint.
  Future<NavigatorQueryResponseModel> submitQuery(String rawQuery) async {
    final trimmed = rawQuery.trim();
    if (trimmed.isEmpty) {
      throw const ApiException('Query cannot be empty.');
    }
    if (trimmed.length > 500) {
      throw const ApiException('Query must not exceed 500 characters.');
    }

    final response = await apiClient.post(
      '/public/navigator/query/',
      body: {'query': trimmed},
      requiresAuth: true,
    );

    final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));
    if (decoded is! Map<String, dynamic>) {
      throw const ApiException('Invalid response format from navigator service.');
    }

    return NavigatorQueryResponseModel.fromJson(decoded);
  }

  /// Determines if a transport or HTTP error is eligible for user retry.
  /// Matches web client: retries offered strictly for recognized network failures,
  /// timeouts, HTTP 429, and HTTP 5xx. Non-transient errors (400, 401, 403, 404)
  /// and unrecognized runtime errors are not retryable.
  bool isRequestErrorRetryable(Object error) {
    if (error is NetworkException) {
      return true;
    }
    if (error is ApiException) {
      final code = error.statusCode;
      if (code == 429) return true;
      if (code != null && code >= 500 && code <= 599) return true;
      return false;
    }
    return false;
  }

  /// Returns a user-friendly error message for the given request failure.
  String getRequestErrorMessage(Object error) {
    if (error is ApiException) {
      final code = error.statusCode;
      if (code == 429) {
        return 'You have sent too many questions in a short time. Please wait a minute, then try again.';
      }
      if (code == 400) {
        return 'Your question could not be processed. Please check your question.';
      }
      if (code == 401) {
        return 'Your session has expired. Please log in again to continue.';
      }
      if (code == 403) {
        return 'Access restricted. Only verified residents can use the navigator.';
      }
      if (code != null && code >= 500) {
        return 'The assistant service encountered a temporary error. Please try again or contact the Barangay Hall.';
      }
    }
    return 'We could not reach the assistant. Check your connection and try again, or contact the Barangay Hall.';
  }
}
