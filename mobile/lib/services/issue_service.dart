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
    XFile? imageFile,
  }) async {
    // 1. Prepare the standard text fields
    final fields = {
      'title': title.trim(),
      'description': description.trim(),
      'location': location.trim(),
    };

    List<http.MultipartFile>? files;

    // 2. Prepare the image file if the resident took a photo
    if (imageFile != null) {
      // We read as bytes so this works perfectly on both Mobile AND Web!
      final bytes = await imageFile.readAsBytes();
      final multipartFile = http.MultipartFile.fromBytes(
        'image', // This MUST match the Django model's ImageField name
        bytes,
        filename: imageFile.name,
      );
      files = [multipartFile];
    }

    // 3. Fire it off to our new multipart handler
    await apiClient.postMultipart(
      '/reports/',
      fields: fields,
      files: files,
      requiresAuth: true, // Only logged-in residents can report issues
    );
  }
}