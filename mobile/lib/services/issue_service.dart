import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../core/network/api_client.dart';

class IssueService {
  final ApiClient apiClient;

  IssueService({required this.apiClient});

  /// Submits a new issue report to the Django backend
  Future<void> submitIssue({
    required String title,
    required String description,
    required String location,
    required String category,
    required String urgency,
    XFile? imageFile,
  }) async {
    final fields = {
      'title': title.trim(),
      'description': description.trim(),
      'location': location.trim(),
      'category': category,
      'urgency': urgency,
    };

    List<http.MultipartFile>? files;

    if (imageFile != null) {
      final bytes = await imageFile.readAsBytes();
      final multipartFile = http.MultipartFile.fromBytes(
        'image', 
        bytes,
        filename: imageFile.name,
      );
      files = [multipartFile];
    }

    await apiClient.postMultipart(
      '/reports/',
      fields: fields,
      files: files,
      requiresAuth: true, 
    );
  }

  /// Fetches the resident's historical issue reports
  Future<List<IssueReport>> getMyIssues() async {
    final response = await apiClient.get('/reports/');
    final Map<String, dynamic> data = jsonDecode(response.body);
    
    final List<dynamic> results = data['results'] ?? [];
    return results.map((item) => IssueReport.fromJson(item)).toList();
  }
}

/// A clean Dart model to represent the Django IssueReport JSON
class IssueReport {
  final int id;
  final String title;
  final String description;
  final String location;
  final String status;
  final String category;
  final String urgency;
  final String? imageUrl;
  final String createdAt;

  IssueReport({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.status,
    this.category = 'OTHER',
    this.urgency = 'MINOR',
    this.imageUrl,
    required this.createdAt,
  });

  factory IssueReport.fromJson(Map<String, dynamic> json) {
    return IssueReport(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? 'Unknown Issue',
      description: json['description'] as String? ?? '',
      location: json['location'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      category: json['category'] as String? ?? 'OTHER',
      urgency: json['urgency'] as String? ?? 'MINOR',
      imageUrl: json['image'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}