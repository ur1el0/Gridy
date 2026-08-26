import 'package:flutter/material.dart';

/// Model representing a resident's document request (e.g. Barangay Clearance, Certificate of Residency, Business Permit).
class DocumentRequestModel {
  final int id;
  final String documentType;
  final String urgencyTag;
  final String status;
  final String? adminNotes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const DocumentRequestModel({
    required this.id,
    required this.documentType,
    this.urgencyTag = 'REGULAR',
    this.status = 'PENDING',
    this.adminNotes,
    this.createdAt,
    this.updatedAt,
  });

  factory DocumentRequestModel.fromJson(Map<String, dynamic> json) {
    return DocumentRequestModel(
      id: (json['request_id'] ?? json['id']) as int? ?? 0,
      documentType: json['document_type'] as String? ?? 'Document Request',
      urgencyTag: json['urgency_tag'] as String? ?? 'REGULAR',
      status: json['status'] as String? ?? 'PENDING',
      adminNotes: json['admin_notes'] as String?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'document_type': documentType,
      'urgency_tag': urgencyTag,
      'status': status,
      'admin_notes': adminNotes,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isProcessing => status.toUpperCase() == 'PROCESSING';
  bool get isReadyForPickup => status.toUpperCase() == 'READY_FOR_PICKUP';
  bool get isReleased => status.toUpperCase() == 'RELEASED';
  bool get isRejected => status.toUpperCase() == 'REJECTED';
  bool get isCompleted => isReleased;

  /// Returns tracking ID formatted matching reference design (e.g. "ID: #BC-2026-0892")
  String get formattedTrackingId {
    final prefix = _getDocumentPrefix(documentType);
    final year = createdAt != null ? createdAt!.year : DateTime.now().year;
    final paddedId = id.toString().padLeft(4, '0');
    return 'ID: #$prefix-$year-$paddedId';
  }

  /// Returns human-readable date string (e.g. "Requested Oct 24, 2026")
  String get formattedRequestedDate {
    if (createdAt == null) {
      return 'Requested recently';
    }
    final dt = createdAt!;
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final monthName = months[dt.month - 1];
    return 'Requested $monthName ${dt.day}, ${dt.year}';
  }

  /// Human-readable badge text in uppercase matching reference UI (e.g. "PROCESSING", "READY FOR PICKUP")
  String get statusBadgeLabel {
    switch (status.toUpperCase()) {
      case 'PROCESSING':
        return 'PROCESSING';
      case 'READY_FOR_PICKUP':
        return 'READY FOR PICKUP';
      case 'RELEASED':
        return 'COMPLETED';
      case 'REJECTED':
        return 'REJECTED';
      case 'PENDING':
      default:
        return 'PENDING';
    }
  }

  /// Badge background color matching reference UI
  Color get statusBadgeBgColor {
    switch (status.toUpperCase()) {
      case 'PROCESSING':
        return const Color(0xFFDBEAFE);
      case 'READY_FOR_PICKUP':
        return const Color(0xFFDCFCE7);
      case 'RELEASED':
        return const Color(0xFFF1F5F9);
      case 'REJECTED':
        return const Color(0xFFFEE2E2);
      case 'PENDING':
      default:
        return const Color(0xFFFEF3C7);
    }
  }

  /// Badge text color matching reference UI
  Color get statusBadgeTextColor {
    switch (status.toUpperCase()) {
      case 'PROCESSING':
        return const Color(0xFF1E40AF);
      case 'READY_FOR_PICKUP':
        return const Color(0xFF15803D);
      case 'RELEASED':
        return const Color(0xFF64748B);
      case 'REJECTED':
        return const Color(0xFFDC2626);
      case 'PENDING':
      default:
        return const Color(0xFFB45309);
    }
  }

  /// Human-readable label for status descriptions
  String get statusDisplay {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending Review';
      case 'PROCESSING':
        return 'In Processing';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      case 'RELEASED':
        return 'Released / Completed';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }

  static String _getDocumentPrefix(String docType) {
    final lower = docType.toLowerCase();
    if (lower.contains('clearance')) return 'BC';
    if (lower.contains('indigency')) return 'CI';
    if (lower.contains('residency')) return 'RC';
    if (lower.contains('business') || lower.contains('permit')) return 'BP';
    if (lower.contains('tax')) return 'TC';
    return 'DOC';
  }
}
