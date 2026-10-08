import 'dart:convert';
import 'dart:typed_data';

import '../core/network/api_client.dart';
import '../models/document_request_model.dart';
import 'storage_service.dart';

/// Service coordinating document request fetching, creation, and PDF downloads
class DocumentService {
  final ApiClient apiClient;
  final StorageService storageService;

  DocumentService({required this.apiClient, required this.storageService});

  /// Fetches all document requests for the authenticated user from the backend API
  Future<List<DocumentRequestModel>> fetchDocumentRequests() async {
    try {
      final response = await apiClient.get(
        '/document-requests/',
        requiresAuth: true,
      );
      final Map<String, dynamic> data = jsonDecode(
        utf8.decode(response.bodyBytes),
      );

      // Handle Django DRF PageNumberPagination by safely extracting the 'results' array
      final List<dynamic> list = data.containsKey('results')
          ? data['results']
          : data.values.toList();

      return list
          .map(
            (item) =>
                DocumentRequestModel.fromJson(item as Map<String, dynamic>),
          )
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Creates a new document request for the authenticated resident
  Future<DocumentRequestModel> createDocumentRequest({
    required String documentType,
    String urgencyTag = 'REGULAR',
    String? purpose,
  }) async {
    try {
      final response = await apiClient.post(
        '/document-requests/',
        body: {
          'document_type': documentType,
          'urgency_tag': urgencyTag.toUpperCase(),
          'purpose': ?purpose,
        },
        requiresAuth: true,
      );

      final Map<String, dynamic> data = jsonDecode(
        utf8.decode(response.bodyBytes),
      );
      return DocumentRequestModel.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  /// Sends a resident-entered GCash reference for manual barangay verification.
  Future<DocumentRequestModel> submitPaymentReference({
    required int requestId,
    required String paymentReference,
  }) async {
    final response = await apiClient.post(
      '/document-requests/$requestId/payment-reference/',
      body: {'payment_reference': paymentReference.trim()},
      requiresAuth: true,
    );
    final data =
        jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
    return DocumentRequestModel.fromJson(data);
  }

  /// Downloads the issued certificate PDF for approved / ready-for-pickup documents
  Future<Uint8List> downloadDocumentPdf(int requestId) async {
    try {
      final response = await apiClient.get(
        '/document-requests/$requestId/generate-pdf/',
        requiresAuth: true,
      );
      return response.bodyBytes;
    } catch (e) {
      rethrow;
    }
  }
}
