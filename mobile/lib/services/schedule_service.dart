import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/activity_schedule_model.dart';
import '../models/document_request_model.dart';
import '../models/user_model.dart';
import 'storage_service.dart';

/// Aggregated data container for the Resident Community & Appointments Schedule screen
class ScheduleData {
  final UserModel? user;
  final List<ActivityScheduleModel> activities;
  final List<DocumentRequestModel> documentRequests;

  const ScheduleData({
    this.user,
    this.activities = const [],
    this.documentRequests = const [],
  });

  /// Returns activities matching the specific calendar day
  List<ActivityScheduleModel> getActivitiesForDate(DateTime date) {
    return activities.where((a) => a.isSameDay(date)).toList();
  }

  /// Returns user's active document requests / pickup appointments
  List<DocumentRequestModel> get activeAppointments {
    return documentRequests
        .where((doc) => doc.isReadyForPickup || doc.isProcessing || doc.isPending)
        .toList();
  }

  /// Returns user's document requests associated with a specific date
  List<DocumentRequestModel> getAppointmentsForDate(DateTime date) {
    final dateFiltered = documentRequests.where((doc) {
      if (doc.createdAt != null) {
        return doc.createdAt!.year == date.year &&
            doc.createdAt!.month == date.month &&
            doc.createdAt!.day == date.day;
      }
      return false;
    }).toList();

    // If there are specific requests created on this date, return them; otherwise fallback to active pickups
    if (dateFiltered.isNotEmpty) {
      return dateFiltered;
    }
    return activeAppointments;
  }
}

/// Service coordinating community schedule activities and resident appointment data
class ScheduleService {
  final ApiClient apiClient;
  final StorageService storageService;

  ScheduleService({
    required this.apiClient,
    required this.storageService,
  });

  /// Fetches schedule activities and user document appointments concurrently
  Future<ScheduleData> fetchScheduleData() async {
    final cachedUser = storageService.getUser();
    UserModel? currentUser = cachedUser;
    List<ActivityScheduleModel> activities = [];
    List<DocumentRequestModel> documentRequests = [];

    final results = await Future.wait([
      _fetchUserProfile(),
      _fetchActivities(),
      _fetchDocumentRequests(),
    ]);

    if (results[0] != null) currentUser = results[0] as UserModel;
    activities = results[1] as List<ActivityScheduleModel>;
    documentRequests = results[2] as List<DocumentRequestModel>;

    return ScheduleData(
      user: currentUser,
      activities: activities,
      documentRequests: documentRequests,
    );
  }

  Future<UserModel?> _fetchUserProfile() async {
    try {
      final response = await apiClient.get('/auth/me/', requiresAuth: true);
      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      final user = UserModel.fromJson(data);
      await storageService.saveUser(user);
      return user;
    } catch (_) {
      return null;
    }
  }

  Future<List<ActivityScheduleModel>> _fetchActivities() async {
    try {
      final response = await apiClient.get('/activities/', requiresAuth: true);
      final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> list = decoded is Map && decoded.containsKey('results')
          ? decoded['results'] as List<dynamic>
          : (decoded is List ? decoded : const []);
      return list
          .map((item) => ActivityScheduleModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<DocumentRequestModel>> _fetchDocumentRequests() async {
    try {
      final response = await apiClient.get('/document-requests/', requiresAuth: true);
      final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> list = decoded is Map && decoded.containsKey('results')
          ? decoded['results'] as List<dynamic>
          : (decoded is List ? decoded : const []);
      return list
          .map((item) => DocumentRequestModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
