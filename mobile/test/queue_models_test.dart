import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/queue_ticket_model.dart';

void main() {
  group('QueueTicketModel', () {
    test('parses individual ticket JSON correctly', () {
      final json = {
        'ticket_id': 101,
        'ticket_number': 'A-124',
        'resident_name': 'Juan Dela Cruz',
        'service_type': 'Document Issuance',
        'status': 'SERVING',
        'is_priority': true,
        'priority_status': 'priority',
        'created_at': '2026-08-22T08:00:00Z',
        'updated_at': '2026-08-22T08:30:00Z',
      };

      final model = QueueTicketModel.fromJson(json);

      expect(model.id, 101);
      expect(model.ticketNumber, 'A-124');
      expect(model.residentName, 'Juan Dela Cruz');
      expect(model.serviceType, 'Document Issuance');
      expect(model.isServing, isTrue);
      expect(model.isWaiting, isFalse);
      expect(model.isPriority, isTrue);
    });

    test('computes relative completed time ago correctly', () {
      final now = DateTime.now();
      final model = QueueTicketModel(
        id: 1,
        ticketNumber: 'A-123',
        serviceType: 'Business Permit',
        status: 'COMPLETED',
        updatedAt: now.subtract(const Duration(minutes: 2)),
      );

      expect(model.completedTimeAgo, 'Completed 2m ago');
    });
  });

  group('QueueLiveStatusModel', () {
    test('parses live status JSON and derives optimal capacity label', () {
      final liveStatusJson = {
        'current_ticket': 'A-124',
        'current_service': 'Document Issuance',
        'total_waiting': 4,
        'avg_wait_mins': 8,
        'recent_completed': [
          {
            'ticket_id': 123,
            'ticket_number': 'A-123',
            'service_type': 'Business Permit',
            'status': 'COMPLETED',
          },
          {
            'ticket_id': 98,
            'ticket_number': 'C-098',
            'service_type': 'Tax Clearance',
            'status': 'COMPLETED',
          }
        ]
      };

      final userTickets = [
        const QueueTicketModel(
          id: 132,
          ticketNumber: 'A-132',
          status: 'WAITING',
          serviceType: 'Document Issuance',
        ),
      ];

      final status = QueueLiveStatusModel.fromJson(
        liveStatusJson: liveStatusJson,
        userTickets: userTickets,
      );

      expect(status.currentTicket, 'A-124');
      expect(status.currentService, 'Document Issuance');
      expect(status.totalWaiting, 4);
      expect(status.capacityLabel, 'Optimal');
      expect(status.userTicket?.ticketNumber, 'A-132');
      expect(status.recentCompleted.length, 2);
      expect(status.recentCompleted.first.ticketNumber, 'A-123');
      expect(status.estimatedCallTimeFormatted, isNotEmpty);
    });

    test('derives moderate and high capacity labels', () {
      const moderateStatus = QueueLiveStatusModel(totalWaiting: 10);
      expect(moderateStatus.capacityLabel, 'Moderate');

      const highStatus = QueueLiveStatusModel(totalWaiting: 25);
      expect(highStatus.capacityLabel, 'High Load');
    });
  });
}
