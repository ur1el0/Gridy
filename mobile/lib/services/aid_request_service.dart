import 'dart:convert';

import '../core/network/api_client.dart';

class AidRequestService {
  final ApiClient apiClient;

  AidRequestService({required this.apiClient});

  Future<List<Map<String, dynamic>>> fetchRequests() async {
    final response = await apiClient.get('/aid-requests/', requiresAuth: true);
    final decoded = jsonDecode(utf8.decode(response.bodyBytes));
    final data = decoded is Map<String, dynamic> && decoded['results'] is List
        ? decoded['results'] as List<dynamic>
        : decoded as List<dynamic>;
    return data.cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createRequest({
    required String assistanceType,
    required String reason,
  }) async {
    final response = await apiClient.post(
      '/aid-requests/',
      body: {'assistance_type': assistanceType, 'reason': reason.trim()},
      requiresAuth: true,
    );
    return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
  }
}
