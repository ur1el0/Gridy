/// Model representing a resident's document request (e.g. Barangay Clearance, Certificate of Residency).
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
      id: json['id'] as int? ?? 0,
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

  /// Human-readable label for status
  String get statusDisplay {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending Review';
      case 'PROCESSING':
        return 'In Processing';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      case 'RELEASED':
        return 'Released';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }
}
