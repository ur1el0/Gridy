/// Base exception class for all API-related errors.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  const ApiException(
    this.message, {
    this.statusCode,
    this.details,
  });

  @override
  String toString() => message;
}

/// Thrown when authentication credentials are invalid or expired (HTTP 401).
class UnauthorizedException extends ApiException {
  const UnauthorizedException([
    super.message = 'Invalid credentials or session expired. Please log in again.',
    dynamic details,
  ]) : super(statusCode: 401, details: details);
}

/// Thrown when access is forbidden, such as an unverified resident account (HTTP 403).
class ForbiddenException extends ApiException {
  const ForbiddenException([
    super.message = 'Your resident account is pending verification by the admin.',
    dynamic details,
  ]) : super(statusCode: 403, details: details);
}

/// Thrown when request data fails backend validation rules (HTTP 400).
class ValidationException extends ApiException {
  final Map<String, List<String>> errors;

  ValidationException(
    super.message, {
    this.errors = const {},
    super.details,
  }) : super(statusCode: 400);

  /// Factory constructor to parse standard DRF serializer errors
  factory ValidationException.fromDrfErrors(Map<String, dynamic> errorMap) {
    final Map<String, List<String>> parsedErrors = {};
    final StringBuffer summary = StringBuffer();

    errorMap.forEach((key, value) {
      if (value is List) {
        final list = value.map((e) => e.toString()).toList();
        parsedErrors[key] = list;
        if (summary.isNotEmpty) summary.write(' ');
        summary.write(list.join(' '));
      } else if (value is String) {
        parsedErrors[key] = [value];
        if (summary.isNotEmpty) summary.write(' ');
        summary.write(value);
      }
    });

    return ValidationException(
      summary.isNotEmpty ? summary.toString() : 'Validation failed.',
      errors: parsedErrors,
      details: errorMap,
    );
  }
}

/// Thrown when a resource is not found (HTTP 404).
class NotFoundException extends ApiException {
  const NotFoundException([
    super.message = 'The requested resource was not found.',
    dynamic details,
  ]) : super(statusCode: 404, details: details);
}

/// Thrown for connectivity, socket, or timeout issues.
class NetworkException extends ApiException {
  const NetworkException([
    super.message = 'Unable to connect to Gridy server. Please check your internet connection or server status.',
  ]) : super(statusCode: null);
}
