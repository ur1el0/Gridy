import 'package:flutter/material.dart';

import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/document_request_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/document_service.dart';
import '../services/storage_service.dart';
import '../widgets/custom_bottom_nav.dart';
import '../widgets/document_details_dialog.dart';
import '../widgets/document_request_card.dart';
import '../widgets/document_search_field.dart';
import '../widgets/empty_document_requests.dart';
import '../widgets/request_document_dialog.dart';
import '../widgets/request_document_grid.dart';
import 'dashboard_screen.dart';
import 'queue_screen.dart';
import 'schedule_screen.dart';
import 'profile_screen.dart';

/// Central Registry Documents Screen matching the reference UI and integrated with live backend APIs
class DocumentsScreen extends StatefulWidget {
  final DocumentService? documentService;
  final AuthService? authService;

  const DocumentsScreen({super.key, this.documentService, this.authService});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  DocumentService? _documentService;
  AuthService? _authService;
  UserModel? _currentUser;
  List<DocumentRequestModel> _requests = [];
  bool _isLoading = true;
  final int _selectedNavIndex = 2;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _initializeAndLoad();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _initializeAndLoad() async {
    _documentService = widget.documentService;
    _authService = widget.authService;

    final storage = await StorageService.init();
    _currentUser = storage.getUser();

    final apiClient = ApiClient();
    _authService ??= AuthService(apiClient: apiClient, storageService: storage);
    _documentService ??= DocumentService(
      apiClient: apiClient,
      storageService: storage,
    );

    await _loadDocumentsData();
  }

  Future<void> _loadDocumentsData() async {
    if (_documentService == null) return;

    try {
      final fetchedRequests = await _documentService!.fetchDocumentRequests();
      if (mounted) {
        setState(() {
          _requests = fetchedRequests;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _openRequestModal(String documentType) {
    if (_documentService == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RequestDocumentDialog(
        initialDocumentType: documentType,
        documentService: _documentService!,
        onCreated: (newDoc) {
          setState(() {
            _requests.insert(0, newDoc);
          });
        },
      ),
    );
  }

  void _openDetailsModal(DocumentRequestModel req) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DocumentDetailsDialog(
        request: req,
        documentService: _documentService,
        onRequestUpdated: _loadDocumentsData,
      ),
    );
  }

  void _navigateToProfile() {
    if (_currentUser == null || _authService == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) =>
            ProfileScreen(user: _currentUser!, authService: _authService!),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredRequests = _searchQuery.isEmpty
        ? _requests
        : _requests.where((r) {
            final q = _searchQuery.toLowerCase();
            return r.documentType.toLowerCase().contains(q) ||
                r.formattedTrackingId.toLowerCase().contains(q) ||
                r.statusBadgeLabel.toLowerCase().contains(q);
          }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 20.0,
              vertical: 8.0,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Brand Header with KapitBayan Logo
                Row(
                  children: [
                    Image.asset(
                      'assets/images/kapitbayan_symbol.png',
                      width: 38,
                      height: 38,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'KapitBayan',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primaryNavy,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),

                // Right Profile Avatar Circle
                GestureDetector(
                  onTap: _navigateToProfile,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFCBD5E1),
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        _currentUser != null &&
                                _currentUser!.fullName.isNotEmpty
                            ? _currentUser!.fullName[0].toUpperCase()
                            : (_currentUser != null &&
                                      _currentUser!.username.isNotEmpty
                                  ? _currentUser!.username[0].toUpperCase()
                                  : 'C'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryNavy,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.primaryNavy,
                ),
              ),
            )
          : RefreshIndicator(
              color: AppColors.primaryNavy,
              onRefresh: _loadDocumentsData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),

                    // Title Header: CENTRAL REGISTRY / Documents
                    const Text(
                      'CENTRAL REGISTRY',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF64748B),
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Documents',
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primaryNavy,
                        letterSpacing: -0.5,
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Search Bar
                    DocumentSearchField(
                      controller: _searchController,
                      query: _searchQuery,
                      onChanged: (value) =>
                          setState(() => _searchQuery = value),
                      onClear: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                    ),

                    const SizedBox(height: 24),

                    // Request New Section (2x2 Grid)
                    RequestDocumentGrid(
                      searchQuery: _searchQuery,
                      onSelectDocument: _openRequestModal,
                      onViewAll: () => _openRequestModal('Barangay Clearance'),
                    ),

                    const SizedBox(height: 28),

                    // My Document Requests Section Header
                    const Text(
                      'My Document Requests',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // List of Requests
                    if (filteredRequests.isEmpty)
                      EmptyDocumentRequests(searchQuery: _searchQuery)
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filteredRequests.length,
                        itemBuilder: (context, index) {
                          final req = filteredRequests[index];
                          return DocumentRequestCard(
                            request: req,
                            onTap: () => _openDetailsModal(req),
                          );
                        },
                      ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _selectedNavIndex,
        onTap: (index) {
          if (index == 0) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const DashboardScreen()),
            );
          } else if (index == 1) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const QueueScreen()),
            );
          } else if (index == 3) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const ScheduleScreen()),
            );
          }
        },
      ),
    );
  }
}
