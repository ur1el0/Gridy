import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../models/queue_ticket_model.dart';

/// Card showing the resident's active queue ticket status
class UserTicketCard extends StatelessWidget {
  final QueueTicketModel? ticket;
  final VoidCallback? onGetTicket;

  const UserTicketCard({
    super.key,
    this.ticket,
    this.onGetTicket,
  });

  @override
  Widget build(BuildContext context) {
    final bool hasTicket = ticket != null && !ticket!.isCompleted && !ticket!.isCancelled;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 16.0),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.radiusMd,
        border: Border.all(
          color: hasTicket ? const Color(0xFFC7D2FE) : AppColors.borderSubtle,
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left Ticket Details
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'YOUR TICKET',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                hasTicket ? ticket!.ticketNumber : 'No Active Ticket',
                style: TextStyle(
                  color: hasTicket ? AppColors.primaryNavy : AppColors.textMuted,
                  fontSize: hasTicket ? 28 : 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              if (hasTicket && ticket!.serviceType.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  ticket!.serviceType,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),

          // Right Ticket Icon Container
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: hasTicket ? AppColors.surfaceNavy : AppColors.inputBackground,
              borderRadius: AppRadius.radiusSm,
            ),
            child: Center(
              child: Icon(
                Icons.confirmation_number_outlined,
                color: hasTicket ? AppColors.primaryNavy : AppColors.textSecondary,
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
