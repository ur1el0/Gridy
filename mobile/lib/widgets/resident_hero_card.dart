import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../models/user_model.dart';

/// Hero status banner displaying resident verification badge, dynamic greeting,
/// and review notice with deep navy gradient styling.
class ResidentHeroCard extends StatelessWidget {
  final UserModel? user;
  final int pendingCount;

  const ResidentHeroCard({
    super.key,
    this.user,
    this.pendingCount = 2,
  });

  @override
  Widget build(BuildContext context) {
    final String displayName = user != null && user!.fullName.isNotEmpty
        ? user!.fullName.split(' ').first
        : (user != null && user!.username.isNotEmpty ? user!.username : 'Citizen');

    final bool isVerified = user?.isVerified ?? true;
    final String? jurisdiction = user?.purok;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: AppRadius.radiusLg,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryNavy,
            AppColors.primaryNavyDark,
          ],
        ),
        border: Border.all(
          color: const Color(0xFF1E3A8A), // Subtle navy border
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryNavy.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Verification Badge & Jurisdiction Tag
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isVerified
                        ? const Color(0xFF10B981).withValues(alpha: 0.2)
                        : const Color(0xFFF59E0B).withValues(alpha: 0.25),
                    borderRadius: AppRadius.radiusPill,
                    border: Border.all(
                      color: isVerified
                          ? const Color(0xFF34D399)
                          : const Color(0xFFFBBF24),
                      width: 1.0,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isVerified
                            ? Icons.verified_rounded
                            : Icons.pending_actions_rounded,
                        size: 13,
                        color: isVerified
                            ? const Color(0xFF6EE7B7)
                            : const Color(0xFFFDE68A),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        isVerified ? 'VERIFIED RESIDENT' : 'PENDING VERIFICATION',
                        style: TextStyle(
                          fontSize: 11.0,
                          fontWeight: FontWeight.w800,
                          color: isVerified
                              ? const Color(0xFFE0F2FE)
                              : const Color(0xFFFEF3C7),
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
                if (jurisdiction != null && jurisdiction.isNotEmpty)
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: AppRadius.radiusPill,
                      ),
                      child: Text(
                        jurisdiction,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),

            // Greeting Headline
            Text(
              'Welcome back, $displayName',
              style: const TextStyle(
                fontSize: 22.0,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 8),

            // Status Notice Banner (Clear Next Action Callout)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: AppRadius.radiusSm,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.12),
                  width: 1.0,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    pendingCount > 0
                        ? Icons.info_outline_rounded
                        : Icons.check_circle_outline_rounded,
                    size: 16,
                    color: pendingCount > 0
                        ? const Color(0xFF93C5FD)
                        : const Color(0xFF6EE7B7),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      pendingCount > 0
                          ? 'Your status is current. There are $pendingCount pending actions for your review.'
                          : 'Your status is current. All your records are up to date.',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.9),
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
