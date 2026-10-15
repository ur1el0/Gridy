import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/quick_services_section.dart';

void main() {
  testWidgets('hides Ask Barangay by default', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: QuickServicesSection())),
    );

    expect(find.text('Ask Barangay'), findsNothing);
    expect(find.text('Request Assistance'), findsOneWidget);
  });

  testWidgets('shows Ask Barangay only when explicitly enabled', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: QuickServicesSection(showAskBarangay: true),
        ),
      ),
    );

    expect(find.text('Ask Barangay'), findsOneWidget);
  });
}
