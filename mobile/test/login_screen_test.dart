import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/screens/login_screen.dart';
import 'package:mobile/widgets/gridy_logo.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
  });

  Future<void> pumpLogin(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.lightTheme, home: const LoginScreen()),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('official mode remains activated by long-pressing the logo', (
    tester,
  ) async {
    await pumpLogin(tester);

    await tester.longPress(find.byType(GridyLogo));
    await tester.pumpAndSettle();

    expect(find.text('Official Sign In'), findsOneWidget);
    expect(find.text('BARANGAY PERSONNEL ACCESS'), findsOneWidget);
  });

  testWidgets('privacy and support sheets show their existing content', (
    tester,
  ) async {
    await pumpLogin(tester);

    await tester.ensureVisible(find.text('PRIVACY POLICY'));
    await tester.tap(find.text('PRIVACY POLICY'));
    await tester.pumpAndSettle();
    expect(find.text('Privacy Policy & Data Protection'), findsOneWidget);
    await tester.tap(find.text('Close'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('SUPPORT'));
    await tester.tap(find.text('SUPPORT'));
    await tester.pumpAndSettle();
    expect(find.text('Barangay Resident Support'), findsOneWidget);
    expect(find.text('(02) 8920-0000 / Hotline 161'), findsOneWidget);
    expect(find.text('support@gridy.gov.ph'), findsOneWidget);
  });
}
