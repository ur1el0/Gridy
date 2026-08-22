import 'package:flutter/foundation.dart';

/// Data model representing an individual queue ticket
@immutable
class QueueTicketModel {
  final int id;
  final String ticketNumber;
  final String residentName;
  final String serviceType;
  final String status;
  final bool isPriority;
  final String priorityStatus;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const QueueTicketModel({
    required this.id,
    required this.ticketNumber,
    this.residentName = '',
    this.serviceType = 'General Service',
    this.status = 'WAITING',
    this.isPriority = false,
    this.priorityStatus = 'regular',
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  bool get isServing => status.toUpperCase() == 'SERVING';
  bool get isWaiting => status.toUpperCase() == 'WAITING';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isCancelled => status.toUpperCase() == 'CANCELLED';

  /// Human-friendly relative timestamp (e.g. "Completed 2m ago")
  String get completedTimeAgo {
    if (updatedAt == null) return 'Completed recently';
    final difference = DateTime.now().difference(updatedAt!);

    if (difference.inMinutes < 1) {
      return 'Completed just now';
    } else if (difference.inMinutes < 60) {
      return 'Completed ${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return 'Completed ${difference.inHours}h ago';
    } else {
      return 'Completed ${difference.inDays}d ago';
    }
  }

  factory QueueTicketModel.fromJson(Map<String, dynamic> json) {
    return QueueTicketModel(
      id: json['ticket_id'] as int? ?? json['id'] as int? ?? 0,
      ticketNumber: json['ticket_number'] as String? ?? '---',
      residentName: json['resident_name'] as String? ?? '',
      serviceType: json['service_type'] as String? ?? 'General Service',
      status: json['status'] as String? ?? 'WAITING',
      isPriority: json['is_priority'] as bool? ?? false,
      priorityStatus: json['priority_status'] as String? ?? 'regular',
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ticket_id': id,
      'ticket_number': ticketNumber,
      'resident_name': residentName,
      'service_type': serviceType,
      'status': status,
      'is_priority': isPriority,
      'priority_status': priorityStatus,
      if (notes != null) 'notes': notes,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}

/// Container for live queue metrics and active ticket states
@immutable
class QueueLiveStatusModel {
  final String? currentTicket;
  final String currentService;
  final int totalWaiting;
  final int avgWaitMins;
  final List<QueueTicketModel> recentCompleted;
  final QueueTicketModel? userTicket;

  const QueueLiveStatusModel({
    this.currentTicket,
    this.currentService = 'Document Issuance',
    this.totalWaiting = 0,
    this.avgWaitMins = 0,
    this.recentCompleted = const [],
    this.userTicket,
  });

  /// Derives human-friendly live capacity label
  String get capacityLabel {
    if (totalWaiting <= 5) return 'Optimal';
    if (totalWaiting <= 15) return 'Moderate';
    return 'High Load';
  }

  /// Calculates estimated call time formatted as hh:mm AM/PM
  String get estimatedCallTimeFormatted {
    final now = DateTime.now();
    final estimatedTime = now.add(Duration(minutes: avgWaitMins > 0 ? avgWaitMins : 15));
    final hour = estimatedTime.hour > 12
        ? estimatedTime.hour - 12
        : (estimatedTime.hour == 0 ? 12 : estimatedTime.hour);
    final period = estimatedTime.hour >= 12 ? 'PM' : 'AM';
    final minute = estimatedTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }

  factory QueueLiveStatusModel.fromJson({
    required Map<String, dynamic> liveStatusJson,
    List<QueueTicketModel> userTickets = const [],
  }) {
    final recentList = (liveStatusJson['recent_completed'] as List<dynamic>?)
            ?.map((item) => QueueTicketModel.fromJson(item as Map<String, dynamic>))
            .toList() ??
        [];

    // Find the resident's active pending or serving ticket
    QueueTicketModel? activeUserTicket;
    for (final ticket in userTickets) {
      if (ticket.isWaiting || ticket.isServing) {
        activeUserTicket = ticket;
        break;
      }
    }

    return QueueLiveStatusModel(
      currentTicket: liveStatusJson['current_ticket'] as String?,
      currentService: liveStatusJson['current_service'] as String? ?? 'Document Issuance',
      totalWaiting: liveStatusJson['total_waiting'] as int? ?? 0,
      avgWaitMins: liveStatusJson['avg_wait_mins'] as int? ?? 0,
      recentCompleted: recentList,
      userTicket: activeUserTicket,
    );
  }
}
