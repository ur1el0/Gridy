import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/hotline_model.dart';

class HotlineService {
  final ApiClient apiClient;

  HotlineService({required this.apiClient});

  Future<List<HotlineModel>> fetchHotlines() async {
    final response = await apiClient.get('/hotlines/', requiresAuth: true);
    final List<dynamic> list = jsonDecode(utf8.decode(response.bodyBytes));
    return list
        .map((item) => HotlineModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}