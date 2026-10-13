import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/widgets/status_badge.dart';

void main() {
  group('StatusBadge Widget Tests', () {
    testWidgets('renders fromStatus with appropriate text formatting and colors', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                StatusBadge.fromStatus('READY_FOR_PICKUP'),
                StatusBadge.fromStatus('RELEASED'),
                StatusBadge.fromStatus('PENDING'),
                StatusBadge.fromStatus('REJECTED'),
              ],
            ),
          ),
        ),
      );

      expect(find.text('Ready For Pickup'), findsOneWidget);
      expect(find.text('Released'), findsOneWidget);
      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('Rejected'), findsOneWidget);
    });

    testWidgets('supports custom colors and optional icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(
              label: 'Custom Verified',
              icon: Icons.check_circle_outline,
              customBackgroundColor: AppColors.surfaceSuccess,
              customTextColor: AppColors.textSuccess,
            ),
          ),
        ),
      );

      expect(find.text('Custom Verified'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });
  });
}

