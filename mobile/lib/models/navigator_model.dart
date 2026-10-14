/// Models representing the Public Information AI Navigator API contract.
/// Mirrors backend/gridy_communications/navigator/serializers.py.
class NavigatorSourceModel {
  final String id;
  final String title;
  final String category;
  final String reference;
  final DateTime? updatedAt;

  const NavigatorSourceModel({
    required this.id,
    required this.title,
    required this.category,
    required this.reference,
    this.updatedAt,
  });

  factory NavigatorSourceModel.fromJson(Map<String, dynamic> json) {
    DateTime? parsedDate;
    final rawDate = json['updated_at'];
    if (rawDate != null) {
      parsedDate = DateTime.tryParse(rawDate.toString());
    }
    return NavigatorSourceModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      reference: json['reference']?.toString() ?? '',
      updatedAt: parsedDate,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'category': category,
        'reference': reference,
        'updated_at': updatedAt?.toIso8601String(),
      };
}

class NavigatorHotlineModel {
  final String name;
  final String number;
  final String category;

  const NavigatorHotlineModel({
    required this.name,
    required this.number,
    required this.category,
  });

  factory NavigatorHotlineModel.fromJson(Map<String, dynamic> json) {
    return NavigatorHotlineModel(
      name: json['name']?.toString() ?? '',
      number: json['number']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'number': number,
        'category': category,
      };
}

class NavigatorEscalationModel {
  final String? officeContact;
  final List<NavigatorHotlineModel> hotlines;
  final String barangayHallNotice;

  NavigatorEscalationModel({
    this.officeContact,
    required List<NavigatorHotlineModel> hotlines,
    required this.barangayHallNotice,
  }) : hotlines = List<NavigatorHotlineModel>.unmodifiable(hotlines);

  factory NavigatorEscalationModel.fromJson(Map<String, dynamic> json) {
    final rawHotlines = json['hotlines'];
    final hotlinesList = (rawHotlines is List<dynamic>)
        ? rawHotlines
            .map((e) =>
                NavigatorHotlineModel.fromJson(e as Map<String, dynamic>))
            .toList()
        : <NavigatorHotlineModel>[];

    return NavigatorEscalationModel(
      officeContact: json['office_contact']?.toString(),
      hotlines: hotlinesList,
      barangayHallNotice: json['barangay_hall_notice']?.toString() ??
          'Please visit your local Barangay Hall for assistance.',
    );
  }

  Map<String, dynamic> toJson() => {
        'office_contact': officeContact,
        'hotlines': hotlines.map((h) => h.toJson()).toList(),
        'barangay_hall_notice': barangayHallNotice,
      };
}

class NavigatorQueryResponseModel {
  final String status; // 'answered', 'abstained', 'unavailable'
  final String answer;
  final String? reason;
  final List<NavigatorSourceModel> sources;
  final NavigatorEscalationModel escalation;

  NavigatorQueryResponseModel({
    required this.status,
    required this.answer,
    this.reason,
    required List<NavigatorSourceModel> sources,
    required this.escalation,
  }) : sources = List<NavigatorSourceModel>.unmodifiable(sources);

  factory NavigatorQueryResponseModel.fromJson(Map<String, dynamic> json) {
    const validStatuses = {'answered', 'abstained', 'unavailable'};
    final rawStatus = json['status']?.toString();
    final hasValidStatus = validStatuses.contains(rawStatus);
    final rawSources = json['sources'];
    final sourcesList = (rawSources is List<dynamic>)
        ? rawSources
            .map((e) =>
                NavigatorSourceModel.fromJson(e as Map<String, dynamic>))
            .toList()
        : <NavigatorSourceModel>[];

    final rawEscalation = json['escalation'];
    final escalationData = rawEscalation is Map<String, dynamic>
        ? NavigatorEscalationModel.fromJson(rawEscalation)
        : NavigatorEscalationModel(
            hotlines: [],
            barangayHallNotice:
                'Please visit your local Barangay Hall for assistance.',
          );

    return NavigatorQueryResponseModel(
      status: hasValidStatus ? rawStatus! : 'unavailable',
      answer: json['answer']?.toString() ?? '',
      reason: hasValidStatus ? json['reason']?.toString() : 'invalid_response',
      sources: sourcesList,
      escalation: escalationData,
    );
  }

  bool get isAnswered => status == 'answered';
  bool get isUnavailable => status == 'unavailable';
  bool get isAbstained => status == 'abstained';
  bool get hasKnownStatus =>
      status == 'answered' || status == 'abstained' || status == 'unavailable';
  bool get isPrivacyNotice =>
      status == 'abstained' &&
      (reason == 'privacy_concern' || (reason?.startsWith('privacy_guard_') ?? false));

  bool get isRetryable {
    if (status != 'unavailable') return false;
    const retryableReasons = {
      'provider_timeout',
      'provider_network_error',
      'provider_server_error',
      'provider_quota_exceeded',
    };
    return retryableReasons.contains(reason ?? '');
  }

  Map<String, dynamic> toJson() => {
        'status': status,
        'answer': answer,
        'reason': reason,
        'sources': sources.map((s) => s.toJson()).toList(),
        'escalation': escalation.toJson(),
      };
}

/// Represents an in-memory conversation turn.
/// NEVER persisted to StorageService, database, or analytics.
class NavigatorTurn {
  final String id;
  final String query;
  final DateTime askedAt;
  final NavigatorQueryResponseModel response;

  const NavigatorTurn({
    required this.id,
    required this.query,
    required this.askedAt,
    required this.response,
  });
}

/// Date formatting helper for Philippine / Manila dates.
String formatManilaDate(DateTime date) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}

/// Time formatting helper for user turn timestamps.
String formatManilaTime(DateTime date) {
  final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
  final minute = date.minute.toString().padLeft(2, '0');
  final period = date.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
}
