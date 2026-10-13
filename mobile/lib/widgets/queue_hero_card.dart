import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

/// Primary hero card displaying the currently served queue ticket at the counter
class QueueHeroCard extends StatelessWidget {
  final String? currentTicket;
  final String serviceType;
  final String location;

  const QueueHeroCard({
    super.key,
    required this.currentTicket,
    this.serviceType = 'Document Issuance',
    this.location = 'Barangay Office',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 22.0, vertical: 22.0),
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
          color: const Color(0xFF1E3A8A),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Status Tag + Live Broadcast Indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: AppRadius.radiusPill,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                    width: 1.0,
                  ),
                ),
                child: const Text(
                  'CURRENTLY AT COUNTER',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              const Icon(
                Icons.sensors_rounded,
                color: Color(0xFF38BDF8), // Cyan live pulse accent
                size: 22,
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Main Serving Ticket Identifier
          Text(
            currentTicket ?? '---',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 52,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.2,
              height: 1.0,
            ),
          ),

          const SizedBox(height: 10),

          // Service Description
          Text(
            serviceType,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
            ),
          ),

          const SizedBox(height: 6),

          // Location Tag
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                color: Colors.white.withValues(alpha: 0.8),
                size: 15,
              ),
              const SizedBox(width: 4),
              Text(
                location,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
