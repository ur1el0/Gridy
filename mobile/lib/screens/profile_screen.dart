import 'package:flutter/material.dart';

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

  @override
  void initState() {
    super.initState();
    _currentUser = widget.user;
    _fullNameController = TextEditingController();
    _contactNumberController = TextEditingController();
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
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _contactNumberController.dispose();
    super.dispose();
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
      );

      if (!mounted) return;

      setState(() {
        _currentUser = updatedUser;
        _isEditing = false;
        _isSaving = false;
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

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update profile: $e'),
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
                    ? 'Update your resident information below.'
                    : 'Review your resident information and account details.',
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
                const SizedBox(height: 20),
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
}
