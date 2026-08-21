import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../models/notification_item_model.dart';

/// Recent notifications section rendering alert items with status badge indicators
class RecentNotificationsSection extends StatelessWidget {
  final List<NotificationItemModel> notifications;
  final VoidCallback? onViewAll;
  final Function(NotificationItemModel)? onNotificationTap;

  const RecentNotificationsSection({
    super.key,
    required this.notifications,
    this.onViewAll,
    this.onNotificationTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Notifications',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: onViewAll,
              child: const Text(
                'View all',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryNavy,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Notifications List Cards
        if (notifications.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: const Center(
              child: Text(
                'No new notifications at this time.',
                style: TextStyle(
                  fontSize: 13.5,
                  color: AppColors.textMuted,
                ),
              ),
            ),
          )
        else
          Column(
            children: notifications.map((item) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10.0),
                child: _NotificationCard(
                  notification: item,
                  onTap: () => onNotificationTap?.call(item),
                ),
              );
            }).toList(),
          ),
      ],
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final NotificationItemModel notification;
  final VoidCallback? onTap;

  const _NotificationCard({
    required this.notification,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color iconBgColor;
    Color iconColor;
    IconData iconData;

    switch (notification.type) {
      case NotificationType.approved:
        iconBgColor = const Color(0xFFE0F2FE);
        iconColor = const Color(0xFF0284C7);
        iconData = Icons.check_circle_outline_rounded;
        break;
      case NotificationType.warning:
        iconBgColor = const Color(0xFFFEE2E2);
        iconColor = const Color(0xFFEF4444);
        iconData = Icons.warning_amber_rounded;
        break;
      case NotificationType.info:
        iconBgColor = const Color(0xFFF1F5F9);
        iconColor = AppColors.primaryNavy;
        iconData = Icons.notifications_none_rounded;
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
        border: Border.all(
          color: const Color(0xFFF1F5F9),
          width: 1.2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
            child: Row(
              children: [
                // Circular Status Badge Icon
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      iconData,
                      color: iconColor,
                      size: 22,
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Title and Timestamp Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        notification.formattedSubtitle,
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w400,
                          color: AppColors.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
