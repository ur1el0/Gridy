import 'my_issues_screen.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../services/issue_service.dart';
import '../services/storage_service.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _descriptionController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  XFile? _selectedImage;
  String _selectedCategory = 'OTHER';
  String _selectedUrgency = 'MINOR';

  final List<String> _categories = [
    'PEACE_AND_ORDER', 'PUBLIC_HEALTH', 'INFRASTRUCTURE', 'ENVIRONMENT', 'OTHER'
  ];
  final List<String> _urgencies = [
    'MINOR', 'MODERATE', 'HAZARD', 'EMERGENCY'
  ];
  bool _isLoading = false;

  IssueService? _issueService;

  @override
  void initState() {
    super.initState();
    _initService();
  }

  Future<void> _initService() async {
    final storage = await StorageService.init();
    final apiClient = ApiClient();
    final token = storage.getAccessToken();
    if (token != null) {
      apiClient.setAuthCredentials(accessToken: token);
    }
    setState(() {
      _issueService = IssueService(apiClient: apiClient);
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = image;
      });
    }
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;
    if (_issueService == null) return;

    setState(() => _isLoading = true);

    try {
      await _issueService!.submitIssue(
        title: _titleController.text,
        description: _descriptionController.text,
        location: _locationController.text,
        category: _selectedCategory,
        urgency: _selectedUrgency,
        imageFile: _selectedImage,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Issue reported successfully!')),
        );
        Navigator.pop(context); // Return to dashboard
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Report an Issue',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            fontSize: 18,
          ),
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: AppColors.primaryNavy),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const MyIssuesScreen()),
              );
            },
            icon: const Icon(Icons.history, size: 18),
            label: const Text('History'),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primaryNavy,
              textStyle: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _issueService == null
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppRadius.radiusLg,
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            controller: _titleController,
                            decoration: const InputDecoration(
                              labelText: 'Issue Title',
                              hintText: 'e.g. Broken Streetlight',
                              filled: true,
                              fillColor: AppColors.inputBackground,
                              border: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                            ),
                            validator: (value) =>
                                value!.isEmpty ? 'Please enter a title' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _locationController,
                            decoration: const InputDecoration(
                              labelText: 'Location',
                              hintText: 'e.g. Main St. corner Elm St.',
                              filled: true,
                              fillColor: AppColors.inputBackground,
                              border: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                            ),
                            validator: (value) =>
                                value!.isEmpty ? 'Please enter a location' : null,
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedCategory,
                            decoration: const InputDecoration(
                              labelText: 'Category',
                              filled: true,
                              fillColor: AppColors.inputBackground,
                              border: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                            ),
                            items: _categories.map((c) => DropdownMenuItem(
                              value: c,
                              child: Text(c.replaceAll('_', ' ')),
                            )).toList(),
                            onChanged: (val) => setState(() => _selectedCategory = val!),
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedUrgency,
                            decoration: const InputDecoration(
                              labelText: 'Urgency',
                              filled: true,
                              fillColor: AppColors.inputBackground,
                              border: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                            ),
                            items: _urgencies.map((u) => DropdownMenuItem(
                              value: u,
                              child: Text(u),
                            )).toList(),
                            onChanged: (val) => setState(() => _selectedUrgency = val!),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              labelText: 'Description',
                              hintText: 'Describe the issue in detail...',
                              alignLabelWithHint: true,
                              filled: true,
                              fillColor: AppColors.inputBackground,
                              border: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: AppRadius.radiusMd,
                                borderSide: BorderSide(color: AppColors.borderSubtle),
                              ),
                            ),
                            validator: (value) =>
                                value!.isEmpty ? 'Please enter a description' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Image Picker Section
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppRadius.radiusLg,
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _selectedImage == null
                                ? Icons.add_a_photo_outlined
                                : Icons.check_circle_outline,
                            size: 40,
                            color: _selectedImage == null ? AppColors.textMuted : AppColors.success,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _selectedImage == null
                                ? 'No photo attached'
                                : 'Photo selected: ${_selectedImage!.name}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: _pickImage,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primaryNavy,
                              side: const BorderSide(color: AppColors.borderLight),
                              shape: const RoundedRectangleBorder(
                                borderRadius: AppRadius.radiusMd,
                              ),
                            ),
                            icon: const Icon(Icons.image, size: 18),
                            label: Text(_selectedImage == null ? 'Attach Photo' : 'Change Photo'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit Button
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitReport,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryNavy,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: const RoundedRectangleBorder(
                            borderRadius: AppRadius.radiusMd,
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Submit Report',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}