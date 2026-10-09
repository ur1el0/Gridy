class BarangayModel {
  final int id;
  final String name;
  final String municipality;
  final String province;

  const BarangayModel({
    required this.id,
    required this.name,
    required this.municipality,
    required this.province,
  });

  factory BarangayModel.fromJson(Map<String, dynamic> json) {
    return BarangayModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.parse(json['id'].toString()),
      name: json['name'] as String? ?? '',
      municipality: json['municipality'] as String? ?? '',
      province: json['province'] as String? ?? '',
    );
  }

  String get displayName {
    final locality = [
      municipality,
      province,
    ].where((part) => part.isNotEmpty).join(', ');
    return locality.isEmpty ? name : '$name ($locality)';
  }
}
