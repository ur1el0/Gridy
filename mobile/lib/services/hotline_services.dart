import 'dart:convert';

import '../core/network/api_client.dart';
import '../core/network/list_response_parser.dart';
import '../models/hotline_model.dart';

class HotlineService {
  final ApiClient apiClient;

  HotlineService({required this.apiClient});

  /// Fetches emergency hotline directory from DRF endpoint /api/v1/hotlines/
  Future<List<HotlineModel>> fetchHotlines() async {
    try {
      final response = await apiClient.get('/hotlines/', requiresAuth: true);
      final hotlines = decodeListResponse(utf8.decode(response.bodyBytes))
          .map(HotlineModel.fromJson)
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
        isActive: true,
      ),
      HotlineModel(
        id: 2,
        name: 'Bureau of Fire Protection (BFP)',
        number: '(02) 8426-0219',
        category: 'FIRE',
        categoryDisplay: 'Fire Department',
        isActive: true,
      ),
      HotlineModel(
        id: 3,
        name: 'Quezon Medical Center / DRRMO',
        number: '(042) 710-3111',
        category: 'MEDICAL',
        categoryDisplay: 'Medical / Hospital',
        isActive: true,
      ),
      HotlineModel(
        id: 4,
        name: 'Barangay Ibabang Dupay Action Desk',
        number: '(042) 710-2345',
        category: 'BARANGAY',
        categoryDisplay: 'Barangay Desk',
        isActive: true,
      ),
    ];
  }
}
