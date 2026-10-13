import 'dart:convert';

import '../core/network/api_client.dart';
import '../core/network/list_response_parser.dart';

class AidRequestService {
  final ApiClient apiClient;

  AidRequestService({required this.apiClient});

  Future<List<Map<String, dynamic>>> fetchRequests() async {
    final response = await apiClient.get('/aid-requests/', requiresAuth: true);
    return decodeListResponse(utf8.decode(response.bodyBytes));
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
