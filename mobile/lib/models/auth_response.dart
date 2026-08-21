import 'user_model.dart';

/// Response payload from `/api/v1/auth/login/` containing the access JWT,
/// authenticated user data, and extracted session cookie.
class AuthResponse {
  final String accessToken;
  final UserModel user;
  final String? refreshCookie;

  const AuthResponse({
    required this.accessToken,
    required this.user,
    this.refreshCookie,
  });

  /// Factory constructor to parse login endpoint JSON and optional set-cookie header
  factory AuthResponse.fromJson(
    Map<String, dynamic> json, {
    String? refreshCookie,
  }) {
    final access = json['access'] as String? ?? '';
    final userJson = json['user'] as Map<String, dynamic>? ?? {};

    return AuthResponse(
      accessToken: access,
      user: UserModel.fromJson(userJson),
      refreshCookie: refreshCookie,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'access': accessToken,
      'user': user.toJson(),
      'refresh_cookie': refreshCookie,
    };
  }

  @override
  String toString() => 'AuthResponse(user: ${user.username}, hasCookie: ${refreshCookie != null})';
}
