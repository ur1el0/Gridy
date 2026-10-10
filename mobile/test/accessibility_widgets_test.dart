import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/widgets/custom_bottom_nav.dart';
import 'package:mobile/widgets/custom_text_field.dart';

void main() {
  testWidgets(
    'CustomTextField exposes its visible label to the editable field',
    (WidgetTester tester) async {
      final controller = TextEditingController();
      addTearDown(controller.dispose);
      final semantics = tester.ensureSemantics();
      try {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: CustomTextField(
                label: 'Email address',
                hintText: 'name@example.com',
                controller: controller,
              ),
            ),
          ),
        );

        final fieldSemantics = tester.getSemantics(find.byType(TextFormField));
        expect(fieldSemantics.label, startsWith('EMAIL ADDRESS'));
        expect(fieldSemantics.flagsCollection.isTextField, isTrue);
        expect(find.text('EMAIL ADDRESS'), findsOneWidget);

        await tester.enterText(
          find.byType(TextFormField),
          'resident@example.com',
        );
        expect(controller.text, 'resident@example.com');
      } finally {
        semantics.dispose();
      }
    },
  );

  testWidgets(
    'bottom navigation exposes named selected controls and tap actions',
    (WidgetTester tester) async {
      final tappedIndices = <int>[];
      final semantics = tester.ensureSemantics();
      try {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              bottomNavigationBar: CustomBottomNav(
                currentIndex: 1,
                onTap: tappedIndices.add,
              ),
            ),
          ),
        );

        final queueSemantics = tester.getSemantics(
          find.bySemanticsLabel('QUEUE'),
        );
        expect(queueSemantics.flagsCollection.isButton, isTrue);
        expect(queueSemantics.flagsCollection.isSelected, Tristate.isTrue);
        expect(
          queueSemantics.getSemanticsData().hasAction(SemanticsAction.tap),
          isTrue,
        );

        final dashboardSemantics = tester.getSemantics(
          find.bySemanticsLabel('DASHBOARD'),
        );
        expect(dashboardSemantics.flagsCollection.isButton, isTrue);
        expect(dashboardSemantics.flagsCollection.isSelected, Tristate.isFalse);
        expect(
          dashboardSemantics.getSemanticsData().hasAction(SemanticsAction.tap),
          isTrue,
        );

        await tester.tap(find.text('DASHBOARD'));
        await tester.tap(find.text('QUEUE'));
        expect(tappedIndices, <int>[0, 1]);
      } finally {
        semantics.dispose();
      }
    },
  );

  test('hint and inactive navigation text colors meet WCAG AA contrast', () {
    expect(
      _contrastRatio(AppColors.textHint, AppColors.inputBackground),
      greaterThanOrEqualTo(4.5),
    );
    expect(
      _contrastRatio(AppColors.textHint, AppColors.inputBackgroundFocused),
      greaterThanOrEqualTo(4.5),
    );
    expect(
      _contrastRatio(AppColors.textHint, AppColors.surface),
      greaterThanOrEqualTo(4.5),
    );
    expect(
      _contrastRatio(AppColors.textHint, AppColors.background),
      greaterThanOrEqualTo(4.5),
    );
    expect(
      _contrastRatio(AppColors.textMuted, AppColors.surface),
      greaterThanOrEqualTo(4.5),
    );
  });
}

double _contrastRatio(Color first, Color second) {
  final firstLuminance = first.computeLuminance();
  final secondLuminance = second.computeLuminance();
  final lighter = firstLuminance > secondLuminance
      ? firstLuminance
      : secondLuminance;
  final darker = firstLuminance < secondLuminance
      ? firstLuminance
      : secondLuminance;
  return (lighter + 0.05) / (darker + 0.05);
}
