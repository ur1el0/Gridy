import 'dart:convert';
import 'dart:typed_data';
import '../core/network/api_client.dart';
import '../models/document_request_model.dart';
import 'storage_service.dart';

/// Service coordinating document request fetching, creation, and PDF downloads
class DocumentService {
  final ApiClient apiClient;
  final StorageService storageService;

  DocumentService({
    required this.apiClient,
    required this.storageService,
  });

  /// Fetches all document requests for the authenticated user from the backend API
  Future<List<DocumentRequestModel>> fetchDocumentRequests() async {
    try {
      final response = await apiClient.get('/document-requests/', requiresAuth: true);
      final List<dynamic> list = jsonDecode(utf8.decode(response.bodyBytes));
      return list
          .map((item) => DocumentRequestModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Creates a new document request for the authenticated resident
  Future<DocumentRequestModel> createDocumentRequest({
    required String documentType,
    String urgencyTag = 'REGULAR',
  }) async {
    try {
      final response = await apiClient.post(
        '/document-requests/',
        body: {
          'document_type': documentType,
          'urgency_tag': urgencyTag.toUpperCase(),
        },
        requiresAuth: true,
      );

      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      return DocumentRequestModel.fromJson(data);
    } catch (e) {
      rethrow;
    }
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
