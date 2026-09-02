import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/screens/register_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createRegisterTestWidget() {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      home: const RegisterScreen(),
    );
  }

  testWidgets('RegisterScreen renders all key elements from reference UI correctly', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(createRegisterTestWidget());
    await tester.pumpAndSettle();

    // Verify brand & title headers
    expect(find.text('GRIDY'), findsOneWidget);
    expect(find.text('Create an Account'), findsOneWidget);
    expect(find.text('Please provide your details to join our\ncommunity.'), findsOneWidget);

    // Verify input field labels
    expect(find.text('FULL NAME'), findsOneWidget);
    expect(find.text('BARANGAY ID / USERNAME'), findsOneWidget);
    expect(find.text('EMAIL ADDRESS'), findsOneWidget);

    // Scroll down to reveal demographic and password fields
    await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -400));
    await tester.pumpAndSettle();

    // Verify new demographic fields
    expect(find.text('CONTACT NUMBER (OPTIONAL)'), findsOneWidget);
    expect(find.text('BIRTH DATE'), findsOneWidget);
    expect(find.text('Registered Voter in this Barangay'), findsOneWidget);

    expect(find.text('PASSWORD'), findsOneWidget);
    expect(find.text('CONFIRM PASSWORD'), findsOneWidget);

    // Scroll back up for hint placeholders
    await tester.drag(find.byType(SingleChildScrollView), const Offset(0, 400));
    await tester.pumpAndSettle();

    // Verify input hint placeholders
    expect(find.text('Roosc Zaño'), findsOneWidget);
    expect(find.text('CID-99201'), findsOneWidget);
    expect(find.text('name@civic.gov'), findsOneWidget);

    // Verify primary action button
    expect(find.text('Register Account'), findsOneWidget);

    // Verify alternative login text
    expect(
      find.byWidgetPredicate(
        (widget) => widget is Text && widget.textSpan?.toPlainText().contains('Already have an account? Login here') == true,
      ),
      findsOneWidget,
    );

    // Verify footer disclaimer
    expect(find.text('BY REGISTERING, YOU AGREE TO OUR\nTERMS OF SERVICE & PRIVACY POLICY.'), findsOneWidget);
  });

  testWidgets('Submitting empty form triggers validation error messages for all fields', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(createRegisterTestWidget());
    await tester.pumpAndSettle();

    // Tap the register button without entering data
    final registerButton = find.text('Register Account');
    expect(registerButton, findsOneWidget);
    await tester.tap(registerButton);
    await tester.pumpAndSettle();

    // Expect field validation error messages
    expect(find.text('Please enter your full name'), findsOneWidget);
    expect(find.text('Please enter your barangay ID or username'), findsOneWidget);
    expect(find.text('Please enter your email address'), findsOneWidget);
    expect(find.text('Please enter a password'), findsOneWidget);
    expect(find.text('Please confirm your password'), findsOneWidget);
  });

  testWidgets('Validates email formatting correctly', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(createRegisterTestWidget());
    await tester.pumpAndSettle();

    // Enter full name, username, invalid email, and valid passwords
    final textFields = find.byType(TextFormField);
    await tester.enterText(textFields.at(0), 'Johnathan Doe');
    await tester.enterText(textFields.at(1), 'CID-99201');
    await tester.enterText(textFields.at(2), 'invalid-email');
    await tester.enterText(textFields.at(3), 'password123');
    await tester.enterText(textFields.at(4), 'password123');

    await tester.tap(find.text('Register Account'));
    await tester.pumpAndSettle();

    expect(find.text('Please enter a valid email address'), findsOneWidget);
  });

  testWidgets('Validates password length and password match confirmation', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(createRegisterTestWidget());
    await tester.pumpAndSettle();

    final textFields = find.byType(TextFormField);
    await tester.enterText(textFields.at(0), 'Johnathan Doe');
    await tester.enterText(textFields.at(1), 'CID-99201');
    await tester.enterText(textFields.at(2), 'john@civic.gov');

    // Test short password
    await tester.enterText(textFields.at(3), 'short');
    await tester.enterText(textFields.at(4), 'short');
    await tester.tap(find.text('Register Account'));
    await tester.pumpAndSettle();

    expect(find.text('Password must be at least 8 characters'), findsOneWidget);

    // Test password mismatch
    await tester.enterText(textFields.at(3), 'validpassword123');
    await tester.enterText(textFields.at(4), 'differentpassword456');
    await tester.tap(find.text('Register Account'));
    await tester.pumpAndSettle();

    expect(find.text('Passwords do not match'), findsOneWidget);
  });

  testWidgets('Toggling password visibility switches icon', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(createRegisterTestWidget());
    await tester.pumpAndSettle();

    // Initially visibility icon is visibility_outlined
    expect(find.byIcon(Icons.visibility_outlined), findsNWidgets(2));

    // Tap first visibility toggle
    await tester.tap(find.byIcon(Icons.visibility_outlined).first);
    await tester.pumpAndSettle();

    // Now one is off and one is on
    expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
    expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
  });
}
