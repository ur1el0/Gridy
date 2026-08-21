import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/activity_schedule_model.dart';
import 'package:mobile/models/announcement_model.dart';
import 'package:mobile/models/document_request_model.dart';
import 'package:mobile/models/notification_item_model.dart';

void main() {
  group('AnnouncementModel', () {
    test('parses announcement JSON correctly', () {
      final json = {
        'id': 1,
        'title': 'Water Service Advisory',
        'content': 'Scheduled water maintenance tomorrow from 1pm to 5pm.',
        'is_pinned': true,
        'created_by': 5,
        'created_at': '2026-08-21T08:30:00Z',
      };

      final model = AnnouncementModel.fromJson(json);

      expect(model.id, 1);
      expect(model.title, 'Water Service Advisory');
      expect(model.isPinned, isTrue);
      expect(model.createdAt, isNotNull);
    });
  });

  group('DocumentRequestModel', () {
    test('parses document request and computes status states', () {
      final json = {
        'id': 42,
        'document_type': 'Barangay Clearance',
        'urgency_tag': 'URGENT',
        'status': 'READY_FOR_PICKUP',
        'admin_notes': 'Please bring 2 valid IDs',
        'created_at': '2026-08-20T10:00:00Z',
      };

      final model = DocumentRequestModel.fromJson(json);

      expect(model.id, 42);
      expect(model.documentType, 'Barangay Clearance');
      expect(model.isReadyForPickup, isTrue);
      expect(model.statusDisplay, 'Ready for Pickup');
      expect(model.adminNotes, 'Please bring 2 valid IDs');
    });
  });

  group('ActivityScheduleModel', () {
    test('formats timeline date tag correctly for future events', () {
      final model = ActivityScheduleModel(
        id: 10,
        title: 'Town Hall Meeting',
        description: 'Assembly meeting',
        eventDatetime: DateTime(2026, 10, 24, 16, 0),
        location: 'Covered Court',
      );

      expect(model.timelineDateTag, 'OCT 24 • 04:00 PM');
      expect(model.location, 'Covered Court');
    });
  });

  group('NotificationItemModel', () {
    test('computes relative subtitle properly', () {
      final notification = NotificationItemModel(
        id: 'notif-1',
        title: 'Tax Clearance Approved',
        category: 'Document Services',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        type: NotificationType.approved,
      );

      expect(notification.formattedSubtitle, contains('Document Services'));
      expect(notification.formattedSubtitle, contains('ago'));
    });
  });
}
