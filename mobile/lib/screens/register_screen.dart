import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/theme/app_colors.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/gridy_logo.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  final AuthService? authService;

  const RegisterScreen({
    super.key,
    this.authService,
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final TextEditingController _contactNumberController = TextEditingController();
  final TextEditingController _philsysIdController = TextEditingController();
  DateTime? _birthDate;
  int? _selectedBarangayId;
  bool _voterStatus = false;
  bool _requiresGuardian = false;
  late TextEditingController _guardianController;

  // Identity & Residency Verification Proofs
  XFile? _philsysPhoto;
  String _utilityBillingType = 'Electric Bill';
  XFile? _utilityBillingPhoto;
  String _secondaryIdType = '';
  XFile? _secondaryIdPhoto;
  bool _dataPrivacyConsent = false;

  final ImagePicker _picker = ImagePicker();

  final List<String> _billingTypes = const [
    'Electric Bill',
    'Water Bill',
    'Internet / Telco Bill',
    'Lease Agreement',
    'Other Utility',
  ];

  final List<String> _secondaryIdTypes = const [
    '',
    'Passport',
    "Driver's License",
    'UMID',
    'Postal ID',
    'PRC ID',
    'Senior / PWD ID',
    'Student ID',
  ];

  AuthService? _authService;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeAuthService();
    _guardianController = TextEditingController();
  }

  Future<void> _initializeAuthService() async {
    if (widget.authService != null) {
      _authService = widget.authService;
    } else {
      final storage = await StorageService.init();
      final apiClient = ApiClient();
      _authService = AuthService(
        apiClient: apiClient,
        storageService: storage,
      );
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _contactNumberController.dispose();
    _guardianController.dispose();
    _philsysIdController.dispose();
    super.dispose();
  }

  Future<void> _pickImageSource(void Function(XFile?) onSelected) async {
    final ImageSource? source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera_rounded, color: AppColors.primaryNavy),
                title: const Text('Take Photo with Camera', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_rounded, color: AppColors.primaryNavy),
                title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source != null) {
      try {
        final XFile? picked = await _picker.pickImage(source: source);
        if (picked != null) {
          setState(() {
            onSelected(picked);
          });
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  Widget _buildPhotoUploadCard({
    required String title,
    required XFile? selectedFile,
    required VoidCallback onPick,
    required VoidCallback onRemove,
    bool enabled = true,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selectedFile != null ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(
            selectedFile != null ? Icons.check_circle_rounded : Icons.upload_file_rounded,
            color: selectedFile != null ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              selectedFile != null ? selectedFile.name : title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: selectedFile != null ? FontWeight.w600 : FontWeight.w500,
                color: selectedFile != null ? AppColors.textPrimary : const Color(0xFF94A3B8),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (selectedFile != null)
            IconButton(
              icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFFEF4444)),
              onPressed: onRemove,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            )
          else
            TextButton(
              onPressed: enabled ? onPick : null,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              child: const Text('SELECT'),
            ),
        ],
      ),
    );
  }

  Future<void> _handleRegister() async {
    FocusScope.of(context).unfocus();

    if (_errorMessage != null) {
      setState(() {
        _errorMessage = null;
      });
    }

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    if (_requiresGuardian && _guardianController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please provide your Guardian\'s Registered ID'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!_dataPrivacyConsent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to the Data Privacy Act (RA 10173) consent.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      if (_authService == null) {
        final storage = await StorageService.init();
        final apiClient = ApiClient();
        _authService = AuthService(
          apiClient: apiClient,
          storageService: storage,
        );
      }

      final UserModel user = await _authService!.register(
        fullName: _fullNameController.text.trim(),
        username: _usernameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        birthDate: _birthDate != null 
          ? "${_birthDate!.year}-${_birthDate!.month.toString().padLeft(2, '0')}-${_birthDate!.day.toString().padLeft(2, '0')}" 
          : "2000-01-01", 
        voterStatus: _voterStatus,
        barangayId: _selectedBarangayId,
        contactNumber: _contactNumberController.text,
        guardianId: _requiresGuardian ? _guardianController.text.trim() : null,
        philsysIdNumber: _philsysIdController.text.trim().isNotEmpty ? _philsysIdController.text.trim() : null,
        philsysPhoto: _philsysPhoto,
        utilityBillingType: _utilityBillingType,
        utilityBillingPhoto: _utilityBillingPhoto,
        secondaryIdType: _secondaryIdType.isNotEmpty ? _secondaryIdType : null,
        secondaryIdPhoto: _secondaryIdPhoto,
      );

      if (!mounted) return;

      setState(() {
        _isLoading = false;
        _errorMessage = null;
      });

      final displayName = user.fullName.isNotEmpty ? user.fullName : user.username;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Account created for $displayName! Please sign in.',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );

      _navigateToLogin();
    } on ValidationException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.message;
      });
    } on NetworkException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.message;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'An unexpected error occurred during registration. Please try again.';
      });
    }
  }

  Future<void> _selectBirthDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _birthDate) {
      // Calculate age
      final today = DateTime.now();
      int age = today.year - picked.year;
      if (today.month < picked.month || (today.month == picked.month && today.day < picked.day)) {
        age--;
      }

      setState(() {
        _birthDate = picked;
        _requiresGuardian = age < 18;
      });
    }
  }

  void _navigateToLogin() {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 32),

                        // Logo & Brand Name
                        const GridyLogo(
                          iconSize: 64,
                          textSize: 24,
                        ),

                        const SizedBox(height: 32),

                        // Header Typography
                        const Text(
                          'Create an Account',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Please provide your details to join our\ncommunity.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w400,
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),

                        // Dynamic Error Alert Banner
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color(0xFFFCA5A5),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.error_outline_rounded,
                                  color: Color(0xFFDC2626),
                                  size: 20,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(
                                      color: Color(0xFFB91C1C),
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w500,
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _errorMessage = null;
                                    });
                                  },
                                  child: const Icon(
                                    Icons.close,
                                    color: Color(0xFF991B1B),
                                    size: 18,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 28),

                        // Full Name Input
                        CustomTextField(
                          label: 'FULL NAME',
                          controller: _fullNameController,
                          hintText: 'Johnathan Doe',
                          prefixIcon: Icons.person_outline_rounded,
                          textInputAction: TextInputAction.next,
                          enabled: !_isLoading,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your full name';
                            }
                            return null;
                          },
                        ),
                        
                        const SizedBox(height: 18),

                        // Local Barangay Jurisdiction Dropdown
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'LOCAL BARANGAY JURISDICTION',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textLabel,
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.inputBackground,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: DropdownButtonFormField<int>(
                                initialValue: _selectedBarangayId,
                                isExpanded: true,
                                icon: const Icon(
                                  Icons.keyboard_arrow_down_rounded,
                                  color: AppColors.textMuted,
                                ),
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.textPrimary,
                                ),
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  errorBorder: InputBorder.none,
                                  focusedErrorBorder: InputBorder.none,
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  prefixIcon: Icon(
                                    Icons.location_on_outlined,
                                    color: AppColors.textMuted,
                                    size: 20,
                                  ),
                                ),
                                hint: const Text(
                                  'Select your Barangay',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w400,
                                    color: AppColors.textHint,
                                  ),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 2,
                                    child: Text(
                                      'Barangay Ibabang Dupay (Lucena City)',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  DropdownMenuItem(
                                    value: 3,
                                    child: Text(
                                      'Barangay Daungan (Pagbilao, Quezon)',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                                onChanged: _isLoading
                                    ? null
                                    : (value) {
                                        setState(() {
                                          _selectedBarangayId = value;
                                        });
                                      },
                                validator: (value) {
                                  if (value == null) {
                                    return 'Please select your barangay';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ],
                        ),

                        // Barangay ID / Username Input
                        CustomTextField(
                          label: 'BARANGAY ID / USERNAME',
                          controller: _usernameController,
                          hintText: 'CID-99201',
                          prefixIcon: Icons.fingerprint_rounded,
                          textInputAction: TextInputAction.next,
                          enabled: !_isLoading,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your barangay ID or username';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 18),

                        // Email Address Input
                        CustomTextField(
                          label: 'EMAIL ADDRESS',
                          controller: _emailController,
                          hintText: 'name@civic.gov',
                          prefixIcon: Icons.mail_outline_rounded,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          enabled: !_isLoading,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your email address';
                            }
                            final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                            if (!emailRegex.hasMatch(value.trim())) {
                              return 'Please enter a valid email address';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 18),

                        // Password Input
                        CustomTextField(
                          label: 'PASSWORD',
                          controller: _passwordController,
                          hintText: '••••••••',
                          prefixIcon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.next,
                          enabled: !_isLoading,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: AppColors.textMuted,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter a password';
                            }
                            if (value.length < 8) {
                              return 'Password must be at least 8 characters';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 18),

                        // Confirm Password Input
                        CustomTextField(
                          label: 'CONFIRM PASSWORD',
                          controller: _confirmPasswordController,
                          hintText: '••••••••',
                          prefixIcon: Icons.shield_outlined,
                          obscureText: _obscureConfirmPassword,
                          textInputAction: TextInputAction.done,
                          enabled: !_isLoading,
                          onFieldSubmitted: (_) => _handleRegister(),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirmPassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: AppColors.textMuted,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureConfirmPassword = !_obscureConfirmPassword;
                              });
                            },
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please confirm your password';
                            }
                            if (value != _passwordController.text) {
                              return 'Passwords do not match';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 24),

                        CustomTextField(
                          label: 'CONTACT NUMBER (OPTIONAL)',
                          controller: _contactNumberController,
                          hintText: '09123456789',
                          prefixIcon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone,
                          enabled: !_isLoading,
                        ),
                        const SizedBox(height: 24),

                        const Text(
                          'BIRTH DATE',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _isLoading ? null : () => _selectBirthDate(context),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today_rounded, color: Color(0xFF94A3B8), size: 20),
                                const SizedBox(width: 12),
                                Text(
                                  _birthDate != null 
                                      ? "${_birthDate!.year}-${_birthDate!.month.toString().padLeft(2, '0')}-${_birthDate!.day.toString().padLeft(2, '0')}"
                                      : "Select your birth date",
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: _birthDate != null ? AppColors.textPrimary : const Color(0xFF94A3B8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        if (_requiresGuardian) ...[
                          const SizedBox(height: 24),
                          CustomTextField(
                            label: "GUARDIAN'S REGISTERED ID (REQUIRED)",
                            controller: _guardianController,
                            hintText: 'CID-XXXXX',
                            prefixIcon: Icons.supervisor_account_outlined,
                            enabled: !_isLoading,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Residents under 18 must be registered under a verified parent or guardian.',
                            style: TextStyle(
                              fontSize: 12, 
                              color: Color(0xFFEF4444),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],

                        const SizedBox(height: 16),
                        SwitchListTile(
                          title: const Text(
                            'Registered Voter in this Barangay',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          value: _voterStatus,
                          activeThumbColor: AppColors.primaryNavy,
                          contentPadding: EdgeInsets.zero,
                          onChanged: _isLoading ? null : (bool value) {
                            setState(() {
                              _voterStatus = value;
                            });
                          },
                        ),
                        const SizedBox(height: 20),

                        // Section Divider & Collapsible Container: Identity & Residency Verification Proofs                        // Section Divider & Collapsible Container: Identity & Residency Verification Proofs
                        Material(
                          color: const Color(0xFFF1F5F9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Theme(
                            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                            child: ExpansionTile(
                              leading: const Icon(Icons.badge_outlined, color: AppColors.primaryNavy, size: 22),
                              title: const Text(
                                'IDENTITY & RESIDENCY VERIFICATION',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              subtitle: Text(
                                (_philsysPhoto != null || _utilityBillingPhoto != null || _secondaryIdPhoto != null || _philsysIdController.text.trim().isNotEmpty)
                                    ? 'Proofs Attached (Tap to view/edit)'
                                    : 'Tap to expand and upload ID proofs',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: (_philsysPhoto != null || _utilityBillingPhoto != null || _secondaryIdPhoto != null || _philsysIdController.text.trim().isNotEmpty)
                                      ? const Color(0xFF10B981)
                                      : AppColors.textSecondary,
                                  fontWeight: (_philsysPhoto != null || _utilityBillingPhoto != null || _secondaryIdPhoto != null || _philsysIdController.text.trim().isNotEmpty)
                                      ? FontWeight.w700
                                      : FontWeight.w400,
                                ),
                              ),
                              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              children: [
                                const Text(
                                  'Provide your Philippine National ID (PhilSys) and a household utility bill to verify local residency.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                    height: 1.35,
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // 1. PhilSys ID Number
                                CustomTextField(
                                  label: 'PHILSYS NATIONAL ID NUMBER',
                                  controller: _philsysIdController,
                                  hintText: 'e.g. 1234-5678-9012-3456',
                                  prefixIcon: Icons.fingerprint_rounded,
                                  enabled: !_isLoading,
                                ),
                                const SizedBox(height: 12),

                                // PhilSys ID Photo Upload
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'PHILSYS ID CARD PHOTO',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textLabel,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                _buildPhotoUploadCard(
                                  title: 'Upload PhilSys ID Photo',
                                  selectedFile: _philsysPhoto,
                                  onPick: () => _pickImageSource((file) => _philsysPhoto = file),
                                  onRemove: () => setState(() => _philsysPhoto = null),
                                  enabled: !_isLoading,
                                ),

                                const SizedBox(height: 18),

                                // 2. Utility Proof of Residency
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'BILLING STATEMENT TYPE',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textLabel,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: DropdownButtonFormField<String>(
                                    initialValue: _utilityBillingType,
                                    isExpanded: true,
                                    decoration: const InputDecoration(
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      prefixIcon: Icon(Icons.receipt_long_outlined, color: AppColors.textMuted, size: 20),
                                    ),
                                    items: _billingTypes.map((type) => DropdownMenuItem(
                                      value: type,
                                      child: Text(type, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
                                    )).toList(),
                                    onChanged: _isLoading ? null : (val) {
                                      if (val != null) setState(() => _utilityBillingType = val);
                                    },
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Utility Billing Photo Upload
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'UPLOAD BILLING RECEIPT',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textLabel,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                _buildPhotoUploadCard(
                                  title: 'Upload Billing Receipt Photo',
                                  selectedFile: _utilityBillingPhoto,
                                  onPick: () => _pickImageSource((file) => _utilityBillingPhoto = file),
                                  onRemove: () => setState(() => _utilityBillingPhoto = null),
                                  enabled: !_isLoading,
                                ),

                                const SizedBox(height: 18),

                                // 3. Optional Secondary Valid ID
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'SECONDARY VALID ID (OPTIONAL)',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textLabel,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: DropdownButtonFormField<String>(
                                    initialValue: _secondaryIdType,
                                    isExpanded: true,
                                    decoration: const InputDecoration(
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      prefixIcon: Icon(Icons.credit_card_outlined, color: AppColors.textMuted, size: 20),
                                    ),
                                    items: _secondaryIdTypes.map((type) => DropdownMenuItem(
                                      value: type,
                                      child: Text(
                                        type.isEmpty ? 'None / Not Applicable' : type,
                                        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                                      ),
                                    )).toList(),
                                    onChanged: _isLoading ? null : (val) {
                                      if (val != null) setState(() => _secondaryIdType = val);
                                    },
                                  ),
                                ),
                                if (_secondaryIdType.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  const Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      'UPLOAD SECONDARY ID',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textLabel,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  _buildPhotoUploadCard(
                                    title: 'Upload Secondary ID Photo',
                                    selectedFile: _secondaryIdPhoto,
                                    onPick: () => _pickImageSource((file) => _secondaryIdPhoto = file),
                                    onRemove: () => setState(() => _secondaryIdPhoto = null),
                                    enabled: !_isLoading,
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),
                        
                        // RA 10173 Data Privacy Act Consent Checkbox
                        CheckboxListTile(
                          value: _dataPrivacyConsent,
                          activeColor: AppColors.primaryNavy,
                          contentPadding: EdgeInsets.zero,
                          controlAffinity: ListTileControlAffinity.leading,
                          title: const Text(
                            'I consent to provide my personal data as a resident for barangay verification, in accordance with the RA 10173 Data Privacy Act.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              height: 1.35,
                            ),
                          ),
                          onChanged: _isLoading ? null : (bool? value) {
                            setState(() {
                              _dataPrivacyConsent = value ?? false;
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        

                        // Register Account Action Button
                        CustomButton(
                          text: 'Register Account',
                          isLoading: _isLoading,
                          icon: Icons.arrow_forward_rounded,
                          onPressed: _handleRegister,
                        ),

                        const SizedBox(height: 28),

                        // Already have an account? Login here
                        Center(
                          child: GestureDetector(
                            onTap: _isLoading ? null : _navigateToLogin,
                            child: Text.rich(
                              const TextSpan(
                                text: 'Already have an account? ',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                                children: [
                                  TextSpan(
                                    text: 'Login here',
                                    style: TextStyle(
                                      color: AppColors.primaryNavy,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),

                        const Spacer(),
                        const SizedBox(height: 28),

                        // Footer Terms & Privacy Notice
                        const Text(
                          'BY REGISTERING, YOU AGREE TO OUR\nTERMS OF SERVICE & PRIVACY POLICY.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textHint,
                            letterSpacing: 0.8,
                            height: 1.4,
                          ),
                        ),

                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
