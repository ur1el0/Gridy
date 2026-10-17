import 'dart:convert';

import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../models/faq_model.dart';

class FAQService {
  final ApiClient apiClient;

  FAQService({required this.apiClient});

  Future<List<FAQModel>> fetchResidentFAQs() async {
    final response = await apiClient.get('/faqs/', requiresAuth: true);
    if (response.statusCode != 200) {
      throw ApiException(
        'We could not load help right now. Please try again.',
        statusCode: response.statusCode,
      );
    }

    final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));
    final List<dynamic> records = decoded is Map<String, dynamic>
        ? (decoded['results'] as List<dynamic>? ?? const [])
        : decoded is List<dynamic>
        ? decoded
        : const [];

    return records
        .whereType<Map<String, dynamic>>()
        .where((item) => item['audience'] == 'RESIDENT')
        .map(FAQModel.fromJson)
        .toList(growable: false);
  }
}
