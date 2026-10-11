import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/network/api_exception.dart';
import '../core/theme/app_colors.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/kapitbayan_logo.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final UserModel user;
  final AuthService authService;

  const ProfileScreen({
    super.key,
    required this.user,
    required this.authService,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;
  bool _isSaving = false;
  late UserModel _currentUser;

  late TextEditingController _fullNameController;
  late TextEditingController _contactNumberController;
  DateTime? _birthDate;
  bool _voterStatus = false;

  late TextEditingController _philsysIdController;
  XFile? _newPhilsysPhoto;
  bool _removePhilsysPhoto = false;

  String _secondaryIdType = 'Passport';
  XFile? _newSecondaryIdPhoto;
  bool _removeSecondaryIdPhoto = false;

  String _utilityBillingType = 'Electric / Meralco';
  XFile? _newUtilityBillingPhoto;
  bool _removeUtilityBillingPhoto = false;

  final ImagePicker _imagePicker = ImagePicker();

  static const List<String> _secondaryIdTypes = [
    'Passport',
    "Driver's License",
    'UMID',
    'Postal ID',
    "Voter's ID",
    'PRC ID',
    'Senior Citizen ID',
    'PWD ID',
    'Other Valid ID',
  ];

  static const List<String> _billingTypes = [
    'Electric / Meralco',
    'Water Utility',
    'Internet / Telecom',
    'Barangay Certification',
    'Lease Contract',
  ];

  @override
  void initState() {
    super.initState();
    _currentUser = widget.user;
    _fullNameController = TextEditingController();
    _contactNumberController = TextEditingController();
    _philsysIdController = TextEditingController();
    _resetFieldsFromUser();
  }

  void _resetFieldsFromUser() {
    _fullNameController.text = _currentUser.fullName;
    _contactNumberController.text = _currentUser.contactNumber ?? '';
    _voterStatus = _currentUser.voterStatus ?? false;
    _birthDate =
        _currentUser.birthDate == null || _currentUser.birthDate!.isEmpty
        ? null
        : DateTime.tryParse(_currentUser.birthDate!);

    _philsysIdController.text = _currentUser.philsysIdNumber ?? '';
    _newPhilsysPhoto = null;
    _removePhilsysPhoto = false;

    _secondaryIdType = _currentUser.secondaryIdType ?? 'Passport';
    if (!_secondaryIdTypes.contains(_secondaryIdType)) {
      _secondaryIdType = 'Passport';
    }
    _newSecondaryIdPhoto = null;
    _removeSecondaryIdPhoto = false;

    _utilityBillingType = _currentUser.utilityBillingType ?? 'Electric / Meralco';
    if (!_billingTypes.contains(_utilityBillingType)) {
      _utilityBillingType = 'Electric / Meralco';
    }
    _newUtilityBillingPhoto = null;
    _removeUtilityBillingPhoto = false;
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _contactNumberController.dispose();
    _philsysIdController.dispose();
    super.dispose();
  }

  int _calculateEffectiveProofCount() {
    int count = 0;
    if (_newPhilsysPhoto != null) {
      count++;
    } else if (_currentUser.hasPhilsysPhoto && !_removePhilsysPhoto) {
      count++;
    }

    if (_newSecondaryIdPhoto != null) {
      count++;
    } else if (_currentUser.hasSecondaryIdPhoto && !_removeSecondaryIdPhoto) {
      count++;
    }

    if (_newUtilityBillingPhoto != null) {
      count++;
    } else if (_currentUser.hasUtilityBillingPhoto && !_removeUtilityBillingPhoto) {
      count++;
    }
    return count;
  }

  Future<void> _pickImage(void Function(XFile file) onSelected) async {
    try {
      final XFile? picked = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() {
          onSelected(picked);
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to select image: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showDocumentViewer({
    required String title,
    required String relativeUrl,
  }) {
    final mediaUrl = widget.authService.getAuthenticatedMediaUrl(relativeUrl);
    final token = widget.authService.storageService.getAccessToken();

    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppBar(
                title: Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                backgroundColor: AppColors.primaryNavy,
                foregroundColor: Colors.white,
                automaticallyImplyLeading: false,
                actions: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    tooltip: 'Close',
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              Container(
                constraints: const BoxConstraints(maxHeight: 400),
                color: Colors.black12,
                child: Center(
                  child: Image.network(
                    mediaUrl,
                    headers: token != null ? {'Authorization': 'Bearer $token'} : null,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: CircularProgressIndicator(),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return const Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.broken_image_rounded, size: 48, color: Colors.grey),
                            SizedBox(height: 8),
                            Text(
                              'Unable to load document image.',
                              style: TextStyle(color: Colors.grey, fontSize: 13),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _selectBirthDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _birthDate) {
      setState(() {
        _birthDate = picked;
      });
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Not provided';
    return "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);

    try {
      final updatedUser = await widget.authService.updateProfile(
        fullName: _fullNameController.text.trim(),
        contactNumber: _contactNumberController.text.trim(),
        birthDate: _birthDate != null ? _formatDate(_birthDate) : null,
        voterStatus: _voterStatus,
        philsysIdNumber: _philsysIdController.text.trim(),
        philsysPhoto: _newPhilsysPhoto,
        removePhilsysPhoto: _removePhilsysPhoto,
        secondaryIdType: _secondaryIdType,
        secondaryIdPhoto: _newSecondaryIdPhoto,
        removeSecondaryIdPhoto: _removeSecondaryIdPhoto,
        utilityBillingType: _utilityBillingType,
        utilityBillingPhoto: _newUtilityBillingPhoto,
        removeUtilityBillingPhoto: _removeUtilityBillingPhoto,
      );

      if (!mounted) return;

      setState(() {
        _currentUser = updatedUser;
        _isEditing = false;
        _isSaving = false;
        _resetFieldsFromUser();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);

      final errorMessage =
          e is ApiException ? e.message : 'Failed to update profile: $e';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _logout(BuildContext context) async {
    await widget.authService.logout();
    if (context.mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final effectiveProofCount = _calculateEffectiveProofCount();
    final bool canRemoveProof = effectiveProofCount > 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    tooltip: 'Back',
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                    color: AppColors.primaryNavy,
                  ),
                  TextButton.icon(
                    onPressed: _isSaving
                        ? null
                        : () {
                            setState(() {
                              if (_isEditing) _resetFieldsFromUser();
                              _isEditing = !_isEditing;
                            });
                          },
                    icon: Icon(
                      _isEditing ? Icons.close_rounded : Icons.edit_outlined,
                    ),
                    label: Text(_isEditing ? 'Cancel' : 'Edit Profile'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Center(child: KapitBayanLogo(iconSize: 64, textSize: 24)),
              const SizedBox(height: 32),
              const Text(
                'My Profile',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _isEditing
                    ? 'Update your resident information and verification documents below.'
                    : 'Review your resident information, verification documents, and account details.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w400,
                  color: AppColors.textSecondary,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 28),
              if (_isEditing) ...[
                CustomTextField(
                  label: 'FULL NAME',
                  controller: _fullNameController,
                  hintText: 'Your full name',
                  prefixIcon: Icons.person_outline_rounded,
                  enabled: !_isSaving,
                ),
                const SizedBox(height: 18),
                CustomTextField(
                  label: 'CONTACT NUMBER',
                  controller: _contactNumberController,
                  hintText: '09123456789',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  enabled: !_isSaving,
                ),
                const SizedBox(height: 18),
                const Text(
                  'BIRTH DATE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF64748B),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: _isSaving ? null : () => _selectBirthDate(context),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.inputBackground,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_rounded,
                          color: AppColors.textMuted,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          _formatDate(_birthDate),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: _birthDate != null
                                ? AppColors.textPrimary
                                : AppColors.textHint,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  title: const Text(
                    'Registered Voter in this Barangay',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  value: _voterStatus,
                  activeThumbColor: AppColors.primaryNavy,
                  contentPadding: EdgeInsets.zero,
                  onChanged: _isSaving
                      ? null
                      : (value) => setState(() => _voterStatus = value),
                ),
                if (_currentUser.isResident) ...[
                  const SizedBox(height: 24),
                  _buildEvidenceEditSection(canRemoveProof: canRemoveProof),
                ],
                const SizedBox(height: 24),
                CustomButton(
                  text: 'Save Changes',
                  icon: Icons.check_rounded,
                  isLoading: _isSaving,
                  onPressed: _isSaving ? null : _saveProfile,
                ),
              ] else ...[
                _buildInfoTile('FULL NAME', _currentUser.fullName),
                _buildInfoTile('USERNAME', _currentUser.username),
                _buildInfoTile('EMAIL ADDRESS', _currentUser.email),
                _buildInfoTile(
                  'CONTACT NUMBER',
                  _currentUser.contactNumber ?? 'Not provided',
                ),
                _buildInfoTile(
                  'BIRTH DATE',
                  _currentUser.birthDate ?? 'Not provided',
                ),
                _buildInfoTile(
                  'VOTER STATUS',
                  _currentUser.voterStatus == true
                      ? 'Registered Voter'
                      : 'Not Registered',
                ),
                if (_currentUser.isResident) ...[
                  const SizedBox(height: 8),
                  _buildEvidenceViewSection(),
                ],
              ],
              const SizedBox(height: 36),
              SizedBox(
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: _isSaving ? null : () => _logout(context),
                  icon: const Icon(
                    Icons.logout_rounded,
                    color: AppColors.error,
                  ),
                  label: const Text(
                    'Log Out',
                    style: TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.error),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.inputBackground,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              value.isNotEmpty ? value : 'Not provided',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEvidenceViewSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'IDENTITY & RESIDENCY PROOF',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Color(0xFF64748B),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),
        _buildEvidenceViewTile(
          title: 'PhilSys National ID',
          subtitle: _currentUser.hasPhilsysPhoto
              ? (_currentUser.philsysIdNumber != null &&
                      _currentUser.philsysIdNumber!.isNotEmpty
                  ? 'ID No: ${_currentUser.philsysIdNumber}'
                  : 'Document on file')
              : 'Not on file',
          isOnFile: _currentUser.hasPhilsysPhoto,
          onView: _currentUser.hasPhilsysPhoto
              ? () => _showDocumentViewer(
                    title: 'PhilSys National ID',
                    relativeUrl: _currentUser.philsysIdPhoto!,
                  )
              : null,
        ),
        const SizedBox(height: 10),
        _buildEvidenceViewTile(
          title: 'Secondary Valid ID',
          subtitle: _currentUser.hasSecondaryIdPhoto
              ? '${_currentUser.secondaryIdType ?? "Valid ID"} (On file)'
              : 'Not on file',
          isOnFile: _currentUser.hasSecondaryIdPhoto,
          onView: _currentUser.hasSecondaryIdPhoto
              ? () => _showDocumentViewer(
                    title: 'Secondary ID (${_currentUser.secondaryIdType ?? "Valid ID"})',
                    relativeUrl: _currentUser.secondaryIdPhoto!,
                  )
              : null,
        ),
        const SizedBox(height: 10),
        _buildEvidenceViewTile(
          title: 'Proof of Residency',
          subtitle: _currentUser.hasUtilityBillingPhoto
              ? '${_currentUser.utilityBillingType ?? "Billing statement"} (On file)'
              : 'Not on file',
          isOnFile: _currentUser.hasUtilityBillingPhoto,
          onView: _currentUser.hasUtilityBillingPhoto
              ? () => _showDocumentViewer(
                    title: 'Proof of Residency (${_currentUser.utilityBillingType ?? "Billing"})',
                    relativeUrl: _currentUser.utilityBillingPhoto!,
                  )
              : null,
        ),
        if (_currentUser.proofDocumentsCount == 0)
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Text(
              'No documents on file. Tap "Edit Profile" above to upload verification documents.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.amber.shade800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildEvidenceViewTile({
    required String title,
    required String subtitle,
    required bool isOnFile,
    VoidCallback? onView,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.inputBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnFile ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isOnFile ? Icons.verified_user_rounded : Icons.file_present_outlined,
            color: isOnFile ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isOnFile ? FontWeight.w600 : FontWeight.w400,
                    color: isOnFile
                        ? const Color(0xFF047857)
                        : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (isOnFile && onView != null)
            TextButton(
              onPressed: onView,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: const Text('VIEW'),
            ),
        ],
      ),
    );
  }

  Widget _buildEvidenceEditSection({required bool canRemoveProof}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'IDENTITY & RESIDENCY PROOF',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Color(0xFF64748B),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Residents must maintain at least one valid identity or residency proof document on file. You can replace existing documents or add additional proofs.',
          style: TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
            height: 1.35,
          ),
        ),
        const SizedBox(height: 16),

        // 1. PhilSys ID
        CustomTextField(
          label: 'PHILSYS NATIONAL ID NUMBER',
          controller: _philsysIdController,
          hintText: 'e.g. 1234-5678-9012-3456',
          prefixIcon: Icons.fingerprint_rounded,
          enabled: !_isSaving,
        ),
        const SizedBox(height: 8),
        const Text(
          'PHILSYS ID PHOTO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        _buildEvidenceItemEdit(
          label: 'Upload PhilSys ID Photo',
          hasExisting: _currentUser.hasPhilsysPhoto,
          newFile: _newPhilsysPhoto,
          isMarkedForRemoval: _removePhilsysPhoto,
          canRemove: canRemoveProof,
          onPick: () => _pickImage((f) => _newPhilsysPhoto = f),
          onRemoveExisting: () => setState(() => _removePhilsysPhoto = true),
          onUndoRemoval: () => setState(() => _removePhilsysPhoto = false),
          onClearNewFile: () => setState(() => _newPhilsysPhoto = null),
        ),

        const SizedBox(height: 18),

        // 2. Secondary Valid ID
        const Text(
          'SECONDARY ID TYPE',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
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
              prefixIcon: Icon(
                Icons.credit_card_outlined,
                color: AppColors.textMuted,
                size: 20,
              ),
            ),
            items: _secondaryIdTypes
                .map(
                  (type) => DropdownMenuItem(
                    value: type,
                    child: Text(
                      type,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                )
                .toList(),
            onChanged: _isSaving
                ? null
                : (val) {
                    if (val != null) setState(() => _secondaryIdType = val);
                  },
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'SECONDARY ID PHOTO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        _buildEvidenceItemEdit(
          label: 'Upload Secondary ID Photo',
          hasExisting: _currentUser.hasSecondaryIdPhoto,
          newFile: _newSecondaryIdPhoto,
          isMarkedForRemoval: _removeSecondaryIdPhoto,
          canRemove: canRemoveProof,
          onPick: () => _pickImage((f) => _newSecondaryIdPhoto = f),
          onRemoveExisting: () => setState(() => _removeSecondaryIdPhoto = true),
          onUndoRemoval: () => setState(() => _removeSecondaryIdPhoto = false),
          onClearNewFile: () => setState(() => _newSecondaryIdPhoto = null),
        ),

        const SizedBox(height: 18),

        // 3. Proof of Residency
        const Text(
          'BILLING STATEMENT TYPE',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
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
              prefixIcon: Icon(
                Icons.receipt_long_outlined,
                color: AppColors.textMuted,
                size: 20,
              ),
            ),
            items: _billingTypes
                .map(
                  (type) => DropdownMenuItem(
                    value: type,
                    child: Text(
                      type,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                )
                .toList(),
            onChanged: _isSaving
                ? null
                : (val) {
                    if (val != null) setState(() => _utilityBillingType = val);
                  },
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'BILLING STATEMENT PHOTO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textLabel,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        _buildEvidenceItemEdit(
          label: 'Upload Billing Statement Photo',
          hasExisting: _currentUser.hasUtilityBillingPhoto,
          newFile: _newUtilityBillingPhoto,
          isMarkedForRemoval: _removeUtilityBillingPhoto,
          canRemove: canRemoveProof,
          onPick: () => _pickImage((f) => _newUtilityBillingPhoto = f),
          onRemoveExisting: () => setState(() => _removeUtilityBillingPhoto = true),
          onUndoRemoval: () => setState(() => _removeUtilityBillingPhoto = false),
          onClearNewFile: () => setState(() => _newUtilityBillingPhoto = null),
        ),
      ],
    );
  }

  Widget _buildEvidenceItemEdit({
    required String label,
    required bool hasExisting,
    required XFile? newFile,
    required bool isMarkedForRemoval,
    required bool canRemove,
    required VoidCallback onPick,
    required VoidCallback onRemoveExisting,
    required VoidCallback onUndoRemoval,
    required VoidCallback onClearNewFile,
  }) {
    final bool hasFileActive =
        newFile != null || (hasExisting && !isMarkedForRemoval);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isMarkedForRemoval
              ? const Color(0xFFF59E0B)
              : hasFileActive
                  ? const Color(0xFF10B981)
                  : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(
            isMarkedForRemoval
                ? Icons.delete_outline_rounded
                : hasFileActive
                    ? Icons.check_circle_rounded
                    : Icons.upload_file_rounded,
            color: isMarkedForRemoval
                ? const Color(0xFFF59E0B)
                : hasFileActive
                    ? const Color(0xFF10B981)
                    : const Color(0xFF94A3B8),
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  newFile != null
                      ? newFile.name
                      : isMarkedForRemoval
                          ? 'Marked for removal'
                          : hasExisting
                              ? 'Document on file'
                              : label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight:
                        hasFileActive ? FontWeight.w600 : FontWeight.w500,
                    color: isMarkedForRemoval
                        ? const Color(0xFFD97706)
                        : hasFileActive
                            ? AppColors.textPrimary
                            : const Color(0xFF94A3B8),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (hasExisting && !isMarkedForRemoval && newFile == null)
                  const Text(
                    'Tap replace to change or remove to delete',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          if (newFile != null) ...[
            IconButton(
              tooltip: 'Clear new selection',
              icon: const Icon(
                Icons.close_rounded,
                size: 20,
                color: Color(0xFFEF4444),
              ),
              onPressed: _isSaving ? null : onClearNewFile,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ] else if (isMarkedForRemoval) ...[
            TextButton(
              onPressed: _isSaving ? null : onUndoRemoval,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: const Text('UNDO'),
            ),
          ] else if (hasExisting) ...[
            TextButton(
              onPressed: _isSaving ? null : onPick,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
              ),
              child: const Text('REPLACE'),
            ),
            const SizedBox(width: 4),
            IconButton(
              tooltip: canRemove
                  ? 'Remove document'
                  : 'Cannot remove: at least one proof must remain on file',
              icon: Icon(
                Icons.delete_outline_rounded,
                size: 20,
                color:
                    canRemove ? const Color(0xFFEF4444) : Colors.grey.shade400,
              ),
              onPressed: _isSaving
                  ? null
                  : canRemove
                      ? onRemoveExisting
                      : () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Cannot remove: residents must maintain at least one identity or residency proof document on file. You may replace this document instead.',
                              ),
                              backgroundColor: Color(0xFFD97706),
                            ),
                          );
                        },
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ] else ...[
            TextButton(
              onPressed: _isSaving ? null : onPick,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryNavy,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: const Text('SELECT'),
            ),
          ],
        ],
      ),
    );
  }
}
