/// Represents an authenticated user in the Gridy platform.
class UserModel {
  final int id;
  final String username;
  final String email;
  final String role;
  final String fullName;
  final bool isVerified;
  final String? contactNumber;
  final String? purok;
  final String? birthDate;
  final bool? voterStatus;

  const UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.fullName,
    this.isVerified = true,
    this.contactNumber,
    this.purok,
    this.birthDate,
    this.voterStatus,
  });

  /// Factory constructor to parse both login payload and /auth/me/ profile responses
  factory UserModel.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>?;

    final String resolvedFullName = json['full_name'] as String? ??
        profile?['full_name'] as String? ??
        json['username'] as String? ??
        '';

    final bool resolvedVerification = profile != null
        ? (profile['is_verified'] as bool? ?? false)
        : (json['is_verified'] as bool? ?? true);

    return UserModel(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'RESIDENT',
      fullName: resolvedFullName,
      isVerified: resolvedVerification,
      contactNumber: profile?['contact_number'] as String? ?? json['contact_number'] as String?,
      purok: profile?['purok']?.toString() ?? json['purok']?.toString(),
      birthDate: profile?['birth_date'] as String? ?? json['birth_date'] as String?,
      voterStatus: profile?['voter_status'] as bool? ?? json['voter_status'] as bool?,
    );
  }

  /// Converts the user model to a JSON map for caching
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
      'full_name': fullName,
      'is_verified': isVerified,
      'contact_number': contactNumber,
      'purok': purok,
      'birth_date': birthDate,
      'voter_status': voterStatus,
    };
  }
  
  /// Convenience getter to check if the user is a resident
  bool get isResident => role.toUpperCase() == 'RESIDENT';

  /// Convenience getter to check if the user is an official or admin
  bool get isOfficial =>
      role.toUpperCase() == 'BARANGAY_OFFICIAL' ||
      role.toUpperCase() == 'ADMIN' ||
      role.toUpperCase() == 'FIELD_OFFICIAL' ||
      role.toUpperCase() == 'DILG_ADMIN';

  /// Convenience getter to check specifically if user has field duties
  bool get isFieldOfficial =>
      role.toUpperCase() == 'FIELD_OFFICIAL' ||
      role.toUpperCase() == 'ADMIN';

  /// Formatted role string for badges and official profile headers
  String get roleDisplay {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'Barangay Executive';
      case 'FIELD_OFFICIAL':
        return 'Field Official / Tanod';
      case 'DILG_ADMIN':
        return 'DILG Super Admin';
      default:
        return 'Resident';
    }
  }
  @override
  String toString() => 'UserModel(id: $id, username: $username, fullName: $fullName, role: $role)';
}
