import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
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
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 18.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
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
                  color: Color(0xFF64748B),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                hasTicket ? ticket!.ticketNumber : 'No Active Ticket',
                style: TextStyle(
                  color: hasTicket ? AppColors.primaryNavy : const Color(0xFF94A3B8),
                  fontSize: hasTicket ? 28 : 20,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              if (hasTicket && ticket!.serviceType.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  ticket!.serviceType,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),

          // Right Ticket Icon Container
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFE0EDFF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(
              child: Icon(
                Icons.confirmation_number_outlined,
                color: Color(0xFF1E60CC),
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
