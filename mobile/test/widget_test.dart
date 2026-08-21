import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('Login screen renders correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const GridyApp());

    // Verify key elements from the login screen are rendered
    expect(find.text('GRIDY'), findsOneWidget);
    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('CITIZEN ID / USERNAME'), findsOneWidget);
    expect(find.text('PASSWORD'), findsOneWidget);
    expect(find.text('Login to'), findsOneWidget);
    expect(find.text('Remember me'), findsOneWidget);
    expect(find.text('Forgot ID?'), findsOneWidget);
  });
}
