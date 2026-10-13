import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../core/network/api_client.dart';
import '../core/network/list_response_parser.dart';
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
      return decodeListResponse(utf8.decode(response.bodyBytes))
          .map(DocumentRequestModel.fromJson)
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
    return decodeListResponse(utf8.decode(response.bodyBytes))
        .map(PaymentRecipientModel.fromJson)
        .toList();
  }

  /// Sends a resident-selected transfer reference and optional receipt screenshot
  /// for manual barangay verification using multipart/form-data.
  Future<DocumentRequestModel> submitPaymentReference({
    required int requestId,
    required int paymentRecipientId,
    required String paymentReference,
    DateTime? transactedAt,
    List<int>? proofImageBytes,
    String? proofImageFilename,
  }) async {
    final fields = <String, String>{
      'payment_recipient_id': paymentRecipientId.toString(),
      'payment_reference': paymentReference.trim(),
    };
    if (transactedAt != null) {
      fields['payment_transacted_at'] = transactedAt.toIso8601String();
    }

    final files = <http.MultipartFile>[];
    if (proofImageBytes != null && proofImageBytes.isNotEmpty) {
      files.add(
        http.MultipartFile.fromBytes(
          'payment_proof_image',
          proofImageBytes,
          filename: proofImageFilename ?? 'proof.jpg',
        ),
      );
    }

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
