import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/activity_schedule_model.dart';
import 'package:mobile/models/document_request_model.dart';
import 'package:mobile/services/schedule_service.dart';

void main() {
  group('ActivityScheduleModel Enhancements', () {
    final eventDt = DateTime(2026, 10, 24, 8, 30);
    final model = ActivityScheduleModel(
      id: 1,
      title: 'Mobile Health Clinic',
      description: 'Free medical consultations and flu vaccines.',
      eventDatetime: eventDt,
      location: 'Community Covered Court',
    );

    test('formats short date and time properly', () {
      expect(model.formattedShortDate, equals('Oct 24'));
      expect(model.formattedTime, equals('08:30 AM'));
      expect(model.formattedEventDateTime, equals('Oct 24 • 08:30 AM'));
    });

    test('isSameDay accurately detects matching calendar dates', () {
      final sameDay = DateTime(2026, 10, 24, 15, 0);
      final diffDay = DateTime(2026, 10, 25, 8, 30);
      expect(model.isSameDay(sameDay), isTrue);
      expect(model.isSameDay(diffDay), isFalse);
    });

    test('timelineDateTag formats correctly', () {
      expect(model.timelineDateTag, contains('OCT 24'));
    });
  });

  group('ScheduleData Container', () {
    final dt1 = DateTime(2026, 10, 24, 9, 0);
    final dt2 = DateTime(2026, 10, 28, 16, 0);

    final activities = [
      ActivityScheduleModel(
        id: 1,
        title: 'Mobile Health Clinic',
        description: 'Health checkups',
        eventDatetime: dt1,
        location: 'Community Covered Court',
      ),
      ActivityScheduleModel(
        id: 2,
        title: 'Barangay Assembly',
        description: 'Quarterly meeting',
        eventDatetime: dt2,
        location: 'Main Hall',
      ),
    ];

    final docRequests = [
      DocumentRequestModel(
        id: 9201,
        documentType: 'Barangay Clearance',
        status: 'READY_FOR_PICKUP',
        createdAt: dt1,
      ),
      DocumentRequestModel(
        id: 9202,
        documentType: 'Certificate of Indigency',
        status: 'RELEASED',
        createdAt: dt2,
      ),
    ];

    final data = ScheduleData(
      activities: activities,
      documentRequests: docRequests,
    );

    test('getActivitiesForDate filters activities by day', () {
      final matching = data.getActivitiesForDate(DateTime(2026, 10, 24));
      expect(matching.length, equals(1));
      expect(matching.first.title, equals('Mobile Health Clinic'));
    });

    test('activeAppointments returns only pending/processing/ready requests', () {
      final active = data.activeAppointments;
      expect(active.length, equals(1));
      expect(active.first.id, equals(9201));
    });

    test('getAppointmentsForDate returns appointments matching created date or active', () {
      final appointments = data.getAppointmentsForDate(DateTime(2026, 10, 24));
      expect(appointments.isNotEmpty, isTrue);
      expect(appointments.first.documentType, equals('Barangay Clearance'));
    });
  });
}
