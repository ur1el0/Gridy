import 'dart:convert';

/// Reads a legacy list or the `results` array in a DRF paginated response.
List<Map<String, dynamic>> decodeListResponse(String body) {
  final Object? payload = jsonDecode(body);
  final Object? rows;

  if (payload is List) {
    rows = payload;
  } else if (payload is Map && payload['results'] is List) {
    rows = payload['results'];
  } else {
    throw const FormatException(
      'Expected a list or a paginated response with a results list.',
    );
  }

  return List<Map<String, dynamic>>.unmodifiable(
    (rows as List).map((row) {
      if (row is Map<String, dynamic>) return row;
      if (row is Map) return Map<String, dynamic>.from(row);
      throw const FormatException(
        'Expected every list result to be an object.',
      );
    }),
  );
}
