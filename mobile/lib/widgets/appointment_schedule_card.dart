import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../models/document_request_model.dart';

/// Appointment card displayed in the "MY APPOINTMENTS" section matching reference UI
class AppointmentScheduleCard extends StatelessWidget {
  final DocumentRequestModel request;
  final VoidCallback? onTap;

  const AppointmentScheduleCard({
    super.key,
    required this.request,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final statusText = _getStatusBadgeText(request.status);
    final timeDisplay = _formatAppointmentTime(request);
    final windowDisplay = _formatWindowLocation(request);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFF1F5F9),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Status Badge & Document Icon
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status Badge with checkmark
                Row(
                  children: [
                    const Icon(
                      Icons.verified_rounded,
                      size: 16,
                      color: AppColors.primaryNavy,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      statusText,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryNavy,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),

                // Right Icon Container (Light Blue Pill/Square)
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.description_outlined,
                      size: 22,
                      color: AppColors.accentBlue,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Title: "Document Pickup"
            Text(
              request.isReadyForPickup ? 'Document Pickup' : '${request.documentType} Request',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),

            const SizedBox(height: 4),

            // Subtitle: "Barangay Clearance (ID-9201)"
            Text(
              '${request.documentType} (ID-${request.id})',
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),

            const SizedBox(height: 16),

            // Bottom Row: Time and Location
            Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 16,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 6),
                Text(
                  timeDisplay,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(width: 20),
                const Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 6),
                Text(
                  windowDisplay,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getStatusBadgeText(String status) {
    switch (status.toUpperCase()) {
      case 'READY_FOR_PICKUP':
        return 'CONFIRMED';
      case 'PROCESSING':
        return 'PROCESSING';
      case 'RELEASED':
        return 'COMPLETED';
      case 'REJECTED':
        return 'REJECTED';
      case 'PENDING':
      default:
        return 'PENDING';
    }
  }

  String _formatAppointmentTime(DocumentRequestModel req) {
    if (req.updatedAt != null) {
      final dt = req.updatedAt!;
      final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final period = dt.hour >= 12 ? 'PM' : 'AM';
      final min = dt.minute.toString().padLeft(2, '0');
      return '${hour.toString().padLeft(2, '0')}:$min $period';
    }
    return '02:30 PM';
  }

  String _formatWindowLocation(DocumentRequestModel req) {
    final windowNum = (req.id % 4) + 1;
    return 'Window $windowNum';
  }
}
