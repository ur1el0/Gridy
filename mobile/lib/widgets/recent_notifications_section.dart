import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
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
              color: AppColors.surface,
              borderRadius: AppRadius.radiusMd,
              border: Border.all(color: AppColors.borderSubtle, width: 1.0),
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
        iconBgColor = AppColors.surfaceCyan;
        iconColor = AppColors.info;
        iconData = Icons.check_circle_outline_rounded;
        break;
      case NotificationType.warning:
        iconBgColor = AppColors.surfaceError;
        iconColor = AppColors.error;
        iconData = Icons.warning_amber_rounded;
        break;
      case NotificationType.info:
        iconBgColor = AppColors.surfaceNavy;
        iconColor = AppColors.primaryNavy;
        iconData = Icons.notifications_none_rounded;
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.radiusMd,
        border: Border.all(
          color: AppColors.borderSubtle,
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: AppRadius.radiusMd,
        child: InkWell(
          onTap: onTap,
          borderRadius: AppRadius.radiusMd,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Row(
              children: [
                // Circular Status Badge Icon
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      iconData,
                      color: iconColor,
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Title and Timestamp Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: const TextStyle(
                          fontSize: 14.0,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        notification.formattedSubtitle,
                        style: const TextStyle(
                          fontSize: 12.0,
                          fontWeight: FontWeight.w400,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.borderLight,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
