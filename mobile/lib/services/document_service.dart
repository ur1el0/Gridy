import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../core/network/api_client.dart';
import '../models/document_request_model.dart';
import '../models/payment_recipient_model.dart';
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

  /// Lists active electronic payment recipients for the resident's barangay.
  Future<List<PaymentRecipientModel>> fetchPaymentRecipients() async {
    final response = await apiClient.get(
      '/payment-recipients/',
      requiresAuth: true,
    );
    final decoded = jsonDecode(utf8.decode(response.bodyBytes));
    final List<dynamic> results = decoded is Map<String, dynamic>
        ? (decoded['results'] as List<dynamic>? ?? <dynamic>[])
        : decoded as List<dynamic>;
    return results
        .map(
          (item) =>
              PaymentRecipientModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  /// Sends a resident-selected transfer reference, timestamp, and required receipt screenshot
  /// for manual barangay verification using multipart/form-data.
  Future<DocumentRequestModel> submitPaymentReference({
    required int requestId,
    required int paymentRecipientId,
    required String paymentReference,
    required DateTime transactedAt,
    required List<int> proofImageBytes,
    required String proofImageFilename,
  }) async {
    if (proofImageBytes.isEmpty) {
      throw ArgumentError.value(
        proofImageBytes,
        'proofImageBytes',
        'A receipt image is required.',
      );
    }
    if (proofImageFilename.trim().isEmpty) {
      throw ArgumentError.value(
        proofImageFilename,
        'proofImageFilename',
        'A receipt filename is required.',
      );
    }

    final fields = <String, String>{
      'payment_recipient_id': paymentRecipientId.toString(),
      'payment_reference': paymentReference.trim(),
    };
    fields['payment_transacted_at'] = transactedAt.toIso8601String();

    final files = <http.MultipartFile>[
      http.MultipartFile.fromBytes(
        'payment_proof_image',
        proofImageBytes,
        filename: proofImageFilename,
      ),
    ];

    final response = await apiClient.postMultipart(
      '/document-requests/$requestId/payment-reference/',
      fields: fields,
      files: files,
      requiresAuth: true,
    );
    final data =
        jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
    return DocumentRequestModel.fromJson(data);
  }

  /// Fetches private authenticated payment proof image bytes for staff or owner inspection
  Future<Uint8List> fetchPaymentProof(int requestId) async {
    final response = await apiClient.get(
      '/document-requests/$requestId/payment-proof/',
      requiresAuth: true,
    );
    return response.bodyBytes;
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
