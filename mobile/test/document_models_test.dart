import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/document_request_model.dart';

void main() {
  group('DocumentRequestModel Unit Tests', () {
    test('parses flat request_id from DRF serializer correctly', () {
      final json = {
        'request_id': 892,
        'document_type': 'Barangay Clearance',
        'urgency_tag': 'REGULAR',
        'status': 'PROCESSING',
        'admin_notes': 'Verifying residency records',
        'created_at': '2026-10-24T08:30:00Z',
        'updated_at': '2026-10-24T09:00:00Z',
      };

      final model = DocumentRequestModel.fromJson(json);

      expect(model.id, 892);
      expect(model.documentType, 'Barangay Clearance');
      expect(model.urgencyTag, 'REGULAR');
      expect(model.status, 'PROCESSING');
      expect(model.isProcessing, isTrue);
      expect(model.isPending, isFalse);
      expect(model.isReadyForPickup, isFalse);
      expect(model.adminNotes, 'Verifying residency records');
      expect(model.formattedTrackingId, 'ID: #BC-2026-0892');
      expect(model.formattedRequestedDate, 'Requested Oct 24, 2026');
      expect(model.statusBadgeLabel, 'PROCESSING');
      expect(model.statusBadgeBgColor, const Color(0xFFDBEAFE));
      expect(model.statusBadgeTextColor, const Color(0xFF1E40AF));
    });

    test('parses fallback id and computes correct prefix for Business Permit and Ready for Pickup', () {
      final json = {
        'id': 441,
        'document_type': 'Business Permit',
        'urgency_tag': 'URGENT',
        'status': 'READY_FOR_PICKUP',
        'created_at': '2026-10-20T10:00:00Z',
      };

      final model = DocumentRequestModel.fromJson(json);

      expect(model.id, 441);
      expect(model.isReadyForPickup, isTrue);
      expect(model.formattedTrackingId, 'ID: #BP-2026-0441');
      expect(model.formattedRequestedDate, 'Requested Oct 20, 2026');
      expect(model.statusBadgeLabel, 'READY FOR PICKUP');
      expect(model.statusBadgeBgColor, const Color(0xFFDCFCE7));
      expect(model.statusBadgeTextColor, const Color(0xFF15803D));
    });

    test('computes correct prefix for Certificate of Indigency and Residency Certificate', () {
      final indigency = DocumentRequestModel(
        id: 34,
        documentType: 'Certificate of Indigency',
        status: 'PENDING',
        createdAt: DateTime(2026, 5, 15),
      );
      expect(indigency.formattedTrackingId, 'ID: #CI-2026-0034');
      expect(indigency.formattedRequestedDate, 'Requested May 15, 2026');
      expect(indigency.statusBadgeLabel, 'PENDING');

      final residency = DocumentRequestModel(
        id: 112,
        documentType: 'Residency Certificate',
        status: 'RELEASED',
        createdAt: DateTime(2026, 10, 12),
      );
      expect(residency.formattedTrackingId, 'ID: #RC-2026-0112');
      expect(residency.isReleased, isTrue);
      expect(residency.isCompleted, isTrue);
      expect(residency.statusBadgeLabel, 'COMPLETED');
      expect(residency.statusBadgeBgColor, const Color(0xFFF1F5F9));
      expect(residency.statusBadgeTextColor, const Color(0xFF64748B));
    });

    test('serializes to JSON accurately', () {
      final model = DocumentRequestModel(
        id: 10,
        documentType: 'Barangay Clearance',
        urgencyTag: 'URGENT',
        status: 'PROCESSING',
        adminNotes: 'In review',
        createdAt: DateTime.parse('2026-08-26T00:00:00.000Z'),
      );

      final json = model.toJson();
      expect(json['id'], 10);
      expect(json['document_type'], 'Barangay Clearance');
      expect(json['urgency_tag'], 'URGENT');
      expect(json['status'], 'PROCESSING');
      expect(json['admin_notes'], 'In review');
    });
  });
}
