import 'package:flutter/material.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/theme/app_colors.dart';
import '../models/auth_response.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/gridy_logo.dart';
import 'dashboard_screen.dart';
import 'register_screen.dart';
import 'admin_dashboard_screen.dart';
import 'field_official_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  final AuthService? authService;

  const LoginScreen({
    super.key,
    this.authService,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  AuthService? _authService;
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _isOfficialMode = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeAuthService();
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
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    FocusScope.of(context).unfocus();

    if (_errorMessage != null) {
      setState(() {
        _errorMessage = null;
      });
    }

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Ensure auth service is initialized
      if (_authService == null) {
        final storage = await StorageService.init();
        final apiClient = ApiClient();
        _authService = AuthService(
          apiClient: apiClient,
          storageService: storage,
        );
      }

      final AuthResponse authResponse = await _authService!.login(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      );

      // Strict Portal Boundary Enforcement
      if (!_isOfficialMode && authResponse.user.isOfficial) {
        await _authService!.logout();
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _errorMessage =
              'Barangay Personnel must use Official Mode. Long-press the logo to switch.';
        });
        return;
      }

      if (_isOfficialMode && !authResponse.user.isOfficial) {
        await _authService!.logout();
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _errorMessage =
              'Citizen accounts cannot access the Barangay Personnel Portal.';
        });
        return;
      }

      // DILG Admin Guard: DILG oversight is exclusively accessed via the Web Executive Portal
      if (authResponse.user.role.toUpperCase() == 'DILG_ADMIN') {
        await _authService!.logout();
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _errorMessage =
              'DILG Oversight accounts must sign in through the Web Executive Portal.';
        });
        return;
      }

      if (!mounted) return;

      setState(() {
        _isLoading = false;
        _errorMessage = null;
      });

      final displayName = authResponse.user.fullName.isNotEmpty
          ? authResponse.user.fullName
          : authResponse.user.username;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Welcome back, $displayName!',
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

      // Navigate to the appropriate screen based on user role tier
      Widget destinationScreen;
      if (authResponse.user.role.toUpperCase() == 'FIELD_OFFICIAL') {
        // Tier 3: Field Official / Tanod Portal
        destinationScreen = const FieldOfficialScreen();
      } else if (authResponse.user.isOfficial) {
        // Tier 2: Barangay Executive Admin Portal
        destinationScreen = const AdminDashboardScreen();
      } else {
        // Tier 4: Citizen Resident Dashboard
        destinationScreen = const DashboardScreen();
      }

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => destinationScreen),
      );
    } on ForbiddenException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.message;
      });
    } on UnauthorizedException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.message;
      });
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
        _errorMessage = 'An unexpected error occurred. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: IntrinsicHeight(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 36),

                        // Logo & Brand Name with Hidden Toggle
                        Center(
                          child: GestureDetector(
                            onLongPress: () {
                              setState(() {
                                _isOfficialMode = !_isOfficialMode;
                                _errorMessage = null;
                              });
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    _isOfficialMode
                                        ? 'Barangay Personnel Official Mode Activated'
                                        : 'Switched to Citizen Resident Portal',
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  backgroundColor: _isOfficialMode
                                      ? const Color(0xFFD97706)
                                      : const Color(0xFF0284C7),
                                  duration: const Duration(seconds: 2),
                                  behavior: SnackBarBehavior.floating,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              );
                            },
                            child: const GridyLogo(
                              iconSize: 64,
                              textSize: 24,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        if (_isOfficialMode) ...[
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: const Color(0xFFFCD34D),
                                ),
                              ),
                              child: const Text(
                                'BARANGAY PERSONNEL ACCESS',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF92400E),
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ] else ...[
                          const SizedBox(height: 16),
                        ],

                        Text(
                          _isOfficialMode ? 'Official Sign In' : 'Welcome Back',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isOfficialMode
                              ? 'Authorized officials, Tanod, and barangay administrators'
                              : 'Please enter your citizen credentials to continue',
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w400,
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),

                        const SizedBox(height: 40),


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

                        // Citizen ID / Username Input
                        CustomTextField(
                          label: 'Citizen ID / Username',
                          controller: _usernameController,
                          hintText: 'resident',
                          prefixIcon: Icons.person_outline_rounded,
                          textInputAction: TextInputAction.next,
                          enabled: !_isLoading,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your citizen ID or username';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 20),

                        // Password Input
                        CustomTextField(
                          label: 'Password',
                          controller: _passwordController,
                          hintText: '••••••••',
                          prefixIcon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          enabled: !_isLoading,
                          onFieldSubmitted: (_) => _handleLogin(),
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
                              return 'Please enter your password';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Forgot Password Row
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => ForgotPasswordScreen(authService: _authService),
                                ),
                              );
                            },
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primaryNavy,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 28),

                        // Login Action Button
                        CustomButton(
                          text: _isOfficialMode
                              ? 'Authenticate Official'
                              : 'Sign In to Citizen Portal',
                          isLoading: _isLoading,
                          icon: Icons.arrow_forward_rounded,
                          onPressed: _handleLogin,
                        ),

                        const SizedBox(height: 32),

                        // Don't have an account? Register here (Resident mode only)
                        if (!_isOfficialMode) ...[
                          const SizedBox(height: 32),
                          Center(
                            child: GestureDetector(
                              onTap: _isLoading
                                  ? null
                                  : () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => RegisterScreen(
                                            authService: _authService,
                                          ),
                                        ),
                                      );
                                    },
                              child: Text.rich(
                                const TextSpan(
                                  text: "Don't have an account? ",
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  children: [
                                    TextSpan(
                                      text: 'Register here',
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
                        ],

                        const Spacer(),
                        const SizedBox(height: 24),

                        // Footer Links: Privacy Policy • Support
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            GestureDetector(
                              onTap: () => _showPrivacyPolicyModal(context),
                              child: const Text(
                                'PRIVACY POLICY',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textMuted,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10.0),
                              child: Text(
                                '•',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => _showSupportModal(context),
                              child: const Text(
                                'SUPPORT',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textMuted,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ],
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

  void _showPrivacyPolicyModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Privacy Policy & Data Protection',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Gridy Resident Portal is committed to protecting your personal information. '
              'All data submitted during login, registration, document requests, and queue ticketing '
              'is encrypted and processed in full compliance with the Republic Act No. 10173 (Data Privacy Act of 2012).\n\n'
              'Your citizen ID, contact information, and request logs are accessible strictly by authorized Barangay Officials.',
              style: TextStyle(
                fontSize: 13.5,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryNavy,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Close', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSupportModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Barangay Resident Support',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.phone_rounded, color: AppColors.primaryNavy, size: 20),
                SizedBox(width: 12),
                Text('(02) 8920-0000 / Hotline 161', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 12),
            const Row(
              children: [
                Icon(Icons.email_rounded, color: AppColors.primaryNavy, size: 20),
                SizedBox(width: 12),
                Text('support@gridy.gov.ph', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 12),
            const Row(
              children: [
                Icon(Icons.access_time_filled_rounded, color: AppColors.primaryNavy, size: 20),
                SizedBox(width: 12),
                Text('Mon - Fri: 8:00 AM - 5:00 PM', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryNavy,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Close', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
