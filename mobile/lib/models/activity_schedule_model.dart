/// Model representing a scheduled community activity / event.
class ActivityScheduleModel {
  final int id;
  final String title;
  final String description;
  final DateTime eventDatetime;
  final String location;
  final int? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ActivityScheduleModel({
    required this.id,
    required this.title,
    required this.description,
    required this.eventDatetime,
    required this.location,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  factory ActivityScheduleModel.fromJson(Map<String, dynamic> json) {
    return ActivityScheduleModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Community Activity',
      description: json['description'] as String? ?? '',
      eventDatetime: json['event_datetime'] != null
          ? DateTime.tryParse(json['event_datetime'].toString()) ?? DateTime.now()
          : DateTime.now(),
      location: json['location'] as String? ?? 'Barangay Hall',
      createdBy: json['created_by'] as int?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'event_datetime': eventDatetime.toIso8601String(),
      'location': location,
      'created_by': createdBy,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  /// Whether event is scheduled for today
  bool get isToday {
    final now = DateTime.now();
    return eventDatetime.year == now.year &&
        eventDatetime.month == now.month &&
        eventDatetime.day == now.day;
  }

  /// Formatted date tag for timeline (e.g. "TODAY • 09:00 AM" or "OCT 24 • 04:00 PM")
  String get timelineDateTag {
    final hour = eventDatetime.hour > 12
        ? eventDatetime.hour - 12
        : (eventDatetime.hour == 0 ? 12 : eventDatetime.hour);
    final period = eventDatetime.hour >= 12 ? 'PM' : 'AM';
    final minuteStr = eventDatetime.minute.toString().padLeft(2, '0');
    final timeStr = '${hour.toString().padLeft(2, '0')}:$minuteStr $period';

    if (isToday) {
      return 'TODAY • $timeStr';
    }

    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    final monthStr = months[eventDatetime.month - 1];
    final dayStr = eventDatetime.day.toString().padLeft(2, '0');

    return '$monthStr $dayStr • $timeStr';
  }
}
