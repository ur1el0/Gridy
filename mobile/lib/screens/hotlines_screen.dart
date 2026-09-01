import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../models/hotline_model.dart';
import '../services/hotline_services.dart';
import '../services/storage_service.dart';

class HotlinesScreen extends StatefulWidget {
  const HotlinesScreen({super.key});

  @override
  State<HotlinesScreen> createState() => _HotlinesScreenState();
}

class _HotlinesScreenState extends State<HotlinesScreen> {
  HotlineService? _service;
  List<HotlineModel> _hotlines = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeAndLoad();
  }

  Future<void> _initializeAndLoad() async {
    try {
      final storage = await StorageService.init();
      final client = ApiClient(baseUrl: AppConfig.baseUrl);
      final token = storage.getAccessToken();
      if (token != null) {
        client.setAuthCredentials(accessToken: token);
      }
      _service = HotlineService(apiClient: client);
      await _loadHotlines();
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Failed to initialize hotline service.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadHotlines() async {
    if (_service == null) return;
    try {
      final data = await _service!.fetchHotlines();
      if (mounted) {
        setState(() {
          _hotlines = data;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load hotlines.';
          _isLoading = false;
        });
      }
    }
  }

  Color _categoryColor(String category) {
    switch (category.toUpperCase()) {
      case 'POLICE':
        return const Color(0xFF1D4ED8);
      case 'FIRE':
        return const Color(0xFFEA580C);
      case 'MEDICAL':
        return const Color(0xFF059669);
      case 'BARANGAY':
        return const Color(0xFF4F46E5);
      default:
        return const Color(0xFF475569);
    }
  }

  IconData _categoryIcon(String category) {
    switch (category.toUpperCase()) {
      case 'POLICE':
        return Icons.local_police_rounded;
      case 'FIRE':
        return Icons.local_fire_department_rounded;
      case 'MEDICAL':
        return Icons.local_hospital_rounded;
      case 'BARANGAY':
        return Icons.account_balance_rounded;
      default:
        return Icons.phone_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency Hotlines'),
        centerTitle: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _hotlines.isEmpty
                  ? const Center(child: Text('No hotlines available.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _hotlines.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final h = _hotlines[index];
                        final color = _categoryColor(h.category);
                        return Card(
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            leading: CircleAvatar(
                              backgroundColor: color.withValues(alpha: 0.12),
                              child: Icon(_categoryIcon(h.category), color: color, size: 20),
                            ),
                            title: Text(
                              h.name,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Text(
                              h.categoryDisplay,
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                            trailing: GestureDetector(
                              onLongPress: () {
                                Clipboard.setData(ClipboardData(text: h.number));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Number copied to clipboard')),
                                );
                              },
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    h.number,
                                    style: TextStyle(
                                      color: color,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                  Text(
                                    'hold to copy',
                                    style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
