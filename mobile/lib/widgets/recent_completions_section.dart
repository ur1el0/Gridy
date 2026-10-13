import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../models/queue_ticket_model.dart';

/// Section listing recently serviced and completed queue tickets
class RecentCompletionsSection extends StatelessWidget {
  final List<QueueTicketModel> completedTickets;
  final VoidCallback? onViewAll;

  const RecentCompletionsSection({
    super.key,
    required this.completedTickets,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text(
              'Recent Completions',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: onViewAll,
              behavior: HitTestBehavior.opaque,
              child: const Text(
                'VIEW ALL',
                style: TextStyle(
                  color: AppColors.primaryNavy,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // List of Completed Ticket Cards
        if (completedTickets.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20.0),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.radiusMd,
              border: Border.all(color: AppColors.borderSubtle, width: 1.0),
            ),
            child: const Center(
              child: Text(
                'No completed queue tickets yet today',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          )
        else
          ...completedTickets.take(4).map((ticket) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: AppRadius.radiusMd,
                border: Border.all(color: AppColors.borderSubtle, width: 1.0),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Left Ticket Number Badge
                  Container(
                    width: 52,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceNavy,
                      borderRadius: AppRadius.radiusSm,
                      border: Border.all(color: const Color(0xFFC7D2FE), width: 1.0),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      ticket.ticketNumber,
                      style: const TextStyle(
                        color: AppColors.primaryNavy,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Middle Service Description & Timestamp
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ticket.serviceType,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          ticket.formattedUpdatedAt,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Right Green Checkmark Status Icon
                  const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.success,
                    size: 20,
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}
