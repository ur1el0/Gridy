import 'dart:convert';

import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/network/list_response_parser.dart';
import '../models/document_request_model.dart';
import 'issue_service.dart';
import 'storage_service.dart';

/// Service coordinating on-site field actions: live queue ticker, clearance QR validation, and incident inspection
class FieldOfficialService {
  final ApiClient apiClient;
  final StorageService storageService;

  FieldOfficialService({required this.apiClient, required this.storageService});

  /// Advance the live desk queue to the next waiting citizen (POST /tickets/next/)
  Future<Map<String, dynamic>> callNextTicket() async {
    final response = await apiClient.post('/tickets/next/', requiresAuth: true);

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes))
          as Map<String, dynamic>;
    } else {
      final errorData = jsonDecode(utf8.decode(response.bodyBytes));
      final detail = errorData is Map
          ? errorData['detail'] ?? 'Failed to advance queue.'
          : 'Queue error.';
      throw Exception(detail);
    }
  }

  /// Fetches real-time desk counter status
  Future<Map<String, dynamic>> fetchLiveQueueStatus() async {
    final response = await apiClient.get(
      '/tickets/live-status/',
      requiresAuth: true,
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes))
          as Map<String, dynamic>;
    }
    throw ApiException(
      'The live queue could not be loaded. Please try again.',
      statusCode: response.statusCode,
    );
  }

  /// Verifies a physical or digital document clearance by its ID / tracking number
  Future<DocumentRequestModel?> verifyClearance(int documentId) async {
    try {
      final response = await apiClient.get(
        '/document-requests/$documentId/',
        requiresAuth: true,
      );

      if (response.statusCode == 200) {
        final data =
            jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        return DocumentRequestModel.fromJson(data);
      }
      throw ApiException(
        'The clearance could not be checked. Please try again.',
        statusCode: response.statusCode,
      );
    } on NotFoundException {
      return null;
    }
  }

  /// Fetches all active incident reports within the official's barangay jurisdiction
  Future<List<IssueReport>> fetchBarangayIssues() async {
    final response = await apiClient.get('/reports/', requiresAuth: true);

    return decodeListResponse(utf8.decode(response.bodyBytes))
        .map(IssueReport.fromJson)
        .toList();
  }

  /// Updates incident report status on-site (e.g. IN_PROGRESS, RESOLVED)
  Future<void> updateIssueStatus({
    required int reportId,
    required String status,
  }) async {
    await apiClient.patch(
      '/reports/$reportId/',
      body: {'status': status},
      requiresAuth: true,
    );
  }

  /// Updates the triaged urgency of a barangay incident report.
  Future<void> updateIssueUrgency({
    required int reportId,
    required String urgency,
  }) async {
    final response = await apiClient.patch(
      '/reports/$reportId/',
      body: {'urgency': urgency},
      requiresAuth: true,
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update incident urgency.');
    }
  }
}
