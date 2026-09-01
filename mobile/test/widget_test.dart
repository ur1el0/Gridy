import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Login screen renders key elements correctly', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(const GridyApp());
    await tester.pumpAndSettle();

    // Verify brand and header
    expect(find.text('GRIDY'), findsOneWidget);
    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('CITIZEN ID / USERNAME'), findsOneWidget);
    expect(find.text('PASSWORD'), findsOneWidget);
    expect(find.text('Login to'), findsOneWidget);
    expect(find.text('Forgot ID?'), findsOneWidget);
  });

  testWidgets('Submitting empty form triggers validation error messages', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(const GridyApp());
    await tester.pumpAndSettle();

    // Find and tap the submit button
    final loginButton = find.text('Login to');
    expect(loginButton, findsOneWidget);
    await tester.tap(loginButton);
    await tester.pumpAndSettle();

    // Expect validation errors
    expect(find.text('Please enter your citizen ID or username'), findsOneWidget);
  });

  testWidgets('Tapping Register here navigates from LoginScreen to RegisterScreen', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(const GridyApp());
    await tester.pumpAndSettle();

    final registerLinkFinder = find.byWidgetPredicate(
      (widget) => widget is Text && widget.textSpan?.toPlainText().contains('Register here') == true,
    );
    expect(registerLinkFinder, findsOneWidget);

    await tester.tap(registerLinkFinder);
    await tester.pumpAndSettle();

    // Verify RegisterScreen is now visible
    expect(find.text('Create an Account'), findsOneWidget);
    expect(find.text('Register Account'), findsOneWidget);
  });
}
