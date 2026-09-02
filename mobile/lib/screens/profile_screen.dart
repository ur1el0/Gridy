import 'package:flutter/material.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../widgets/custom_text_field.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final UserModel user;
  final AuthService authService;

  const ProfileScreen({super.key, required this.user, required this.authService});

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
    _initControllers();
  }

  void _initControllers() {
    _fullNameController = TextEditingController(text: _currentUser.fullName);
    _contactNumberController = TextEditingController(text: _currentUser.contactNumber ?? '');
    _voterStatus = _currentUser.voterStatus ?? false;

    if (_currentUser.birthDate != null && _currentUser.birthDate!.isNotEmpty) {
      _birthDate = DateTime.tryParse(_currentUser.birthDate!);
    }
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.primaryNavy),
        title: const Text(
          'My Profile',
          style: TextStyle(color: AppColors.primaryNavy, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.close : Icons.edit_outlined, color: AppColors.primaryNavy),
            onPressed: _isSaving
                ? null
                : () {
                    setState(() {
                      if (_isEditing) {
                        _initControllers();
                      }
                      _isEditing = !_isEditing;
                    });
                  },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: CircleAvatar(
                radius: 48,
                backgroundColor: AppColors.primaryNavy,
                child: Text(
                  _currentUser.fullName.isNotEmpty ? _currentUser.fullName[0].toUpperCase() : 'R',
                  style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // --- Editable or Read-Only Fields ---
            if (_isEditing) ...[
              CustomTextField(
                label: 'FULL NAME',
                controller: _fullNameController,
                hintText: 'Your full name',
                prefixIcon: Icons.person_outline_rounded,
                enabled: !_isSaving,
              ),
              const SizedBox(height: 20),
              CustomTextField(
                label: 'CONTACT NUMBER',
                controller: _contactNumberController,
                hintText: '09123456789',
                prefixIcon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                enabled: !_isSaving,
              ),
              const SizedBox(height: 20),
              const Text(
                'BIRTH DATE',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.5),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: _isSaving ? null : () => _selectBirthDate(context),
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
                        _formatDate(_birthDate),
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
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text(
                  'Registered Voter',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                value: _voterStatus,
                activeColor: AppColors.primaryNavy,
                contentPadding: EdgeInsets.zero,
                onChanged: _isSaving ? null : (bool value) {
                  setState(() => _voterStatus = value);
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryNavy,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ] else ...[
              _buildInfoTile('FULL NAME', _currentUser.fullName),
              _buildInfoTile('USERNAME', _currentUser.username),
              _buildInfoTile('EMAIL ADDRESS', _currentUser.email),
              _buildInfoTile('CONTACT NUMBER', _currentUser.contactNumber ?? 'Not provided'),
              _buildInfoTile('BIRTH DATE', _currentUser.birthDate ?? 'Not provided'),
              _buildInfoTile('VOTER STATUS', _currentUser.voterStatus == true ? 'Registered Voter' : 'Not Registered'),
            ],

            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                onPressed: () => _logout(context),
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Log Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
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
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.5),
          ),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Text(
              value.isNotEmpty ? value : 'Not provided',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}