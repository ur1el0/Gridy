import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../models/activity_schedule_model.dart';
import '../models/document_request_model.dart';

class ActivityDetailsDialog extends StatelessWidget {
  final ActivityScheduleModel activity;
  final VoidCallback onAddToCalendar;

  const ActivityDetailsDialog({
    super.key,
    required this.activity,
    required this.onAddToCalendar,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        activity.title,
        style: const TextStyle(
          fontWeight: FontWeight.w900,
          color: AppColors.primaryNavy,
          fontSize: 18,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                size: 16,
                color: AppColors.accentBlue,
              ),
              const SizedBox(width: 8),
              Text(
                activity.formattedEventDateTime,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(
                Icons.location_on_outlined,
                size: 16,
                color: AppColors.accentBlue,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  activity.location,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          if (activity.description.isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              activity.description,
              style: const TextStyle(
                fontSize: 13.5,
                color: Color(0xFF475569),
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            onAddToCalendar();
          },
          child: const Text(
            'Add to Calendar',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }
}

class AppointmentDetailsDialog extends StatelessWidget {
  final DocumentRequestModel request;

  const AppointmentDetailsDialog({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        request.documentType,
        style: const TextStyle(
          fontWeight: FontWeight.w900,
          color: AppColors.primaryNavy,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tracking ID: ${request.formattedTrackingId}',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text('Status: ${request.statusDisplay}'),
          const SizedBox(height: 8),
          Text('Requested: ${request.formattedRequestedDate}'),
          if (request.adminNotes != null && request.adminNotes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Official Notes: ${request.adminNotes}'),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }
}
