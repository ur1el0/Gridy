import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Horizontal calendar date selector strip matching reference UI
class CalendarDayStrip extends StatelessWidget {
  final DateTime selectedDate;
  final Function(DateTime) onDateSelected;
  final List<DateTime> eventDates;

  const CalendarDayStrip({
    super.key,
    required this.selectedDate,
    required this.onDateSelected,
    this.eventDates = const [],
  });

  static const List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  static const List<String> _weekdays = [
    'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
  ];

  @override
  Widget build(BuildContext context) {
    final monthName = _months[selectedDate.month - 1];
    final year = selectedDate.year;

    // Generate current week dates centered around or starting near selectedDate
    final startOfWeek = selectedDate.subtract(Duration(days: selectedDate.weekday - 1));
    final weekDays = List.generate(7, (index) => startOfWeek.add(Duration(days: index)));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Month Header & Navigation Chevrons
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '$monthName $year',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.4,
              ),
            ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left_rounded, size: 24, color: AppColors.textPrimary),
                  onPressed: () {
                    // Navigate to previous week
                    onDateSelected(selectedDate.subtract(const Duration(days: 7)));
                  },
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  splashRadius: 20,
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.chevron_right_rounded, size: 24, color: AppColors.textPrimary),
                  onPressed: () {
                    // Navigate to next week
                    onDateSelected(selectedDate.add(const Duration(days: 7)));
                  },
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  splashRadius: 20,
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 14),

        // Horizontal Days List
        SizedBox(
          height: 82,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: weekDays.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final date = weekDays[index];
              final isSelected = date.year == selectedDate.year &&
                  date.month == selectedDate.month &&
                  date.day == selectedDate.day;
              final dayName = _weekdays[date.weekday - 1];
              final hasEvent = eventDates.any((d) =>
                  d.year == date.year && d.month == date.month && d.day == date.day);

              return GestureDetector(
                onTap: () => onDateSelected(date),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 58,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primaryNavy : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isSelected ? AppColors.primaryNavy : const Color(0xFFE2E8F0),
                      width: 1.0,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primaryNavy.withValues(alpha: 0.25),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        dayName,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF64748B),
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: isSelected ? Colors.white : const Color(0xFF1E293B),
                        ),
                      ),
                      if (hasEvent && !isSelected) ...[
                        const SizedBox(height: 3),
                        Container(
                          width: 4,
                          height: 4,
                          decoration: const BoxDecoration(
                            color: AppColors.accentBlue,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
