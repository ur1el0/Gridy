import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/hotline_model.dart';

class HotlineService {
  final ApiClient apiClient;

  HotlineService({required this.apiClient});

  /// Fetches emergency hotline directory from DRF endpoint /api/v1/hotlines/
  Future<List<HotlineModel>> fetchHotlines() async {
    try {
      final response = await apiClient.get('/hotlines/', requiresAuth: true);
      final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));

      final List<dynamic> list = (decoded is Map<String, dynamic>
          ? decoded['results'] as List<dynamic>?
          : decoded as List<dynamic>?) ?? [];

      final hotlines = list
          .map((item) => HotlineModel.fromJson(item as Map<String, dynamic>))
          .toList();

      if (hotlines.isNotEmpty) {
        return hotlines;
      }
    } catch (_) {
      // Return default emergency hotlines on error or empty DB
    }

    return _getDefaultHotlines();
  }

  /// Default emergency hotline directory matching standard emergency numbers
  static List<HotlineModel> _getDefaultHotlines() {
    return const [
      HotlineModel(
        id: 1,
        name: 'National Police Station (PNP)',
        number: '911 / 117',
        category: 'POLICE',
        categoryDisplay: 'Police',
      ),
      HotlineModel(
        id: 2,
        name: 'Bureau of Fire Protection (BFP)',
        number: '(02) 8426-0219',
        category: 'FIRE',
        categoryDisplay: 'Fire Department',
      ),
      HotlineModel(
        id: 3,
        name: 'Barangay Emergency Medical Service (DRRMO)',
        number: '(02) 8920-1111',
        category: 'MEDICAL',
        categoryDisplay: 'Medical / Hospital',
      ),
      HotlineModel(
        id: 4,
        name: 'Barangay Central Action Desk',
        number: '(02) 8920-0000',
        category: 'BARANGAY',
        categoryDisplay: 'Barangay Desk',
      ),
    ];
  }
}
