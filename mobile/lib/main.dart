import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'services/storage_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  // WidgetsFlutterBinding must be initialized before calling Firebase
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase with the auto-generated config
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialize storage and check if resident is already logged in
  final storage = await StorageService.init();
  final hasToken = storage.getAccessToken() != null;

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  
  runApp(GridyApp(
    home: hasToken ? const DashboardScreen() : const LoginScreen(),
  ));
}
class GridyApp extends StatelessWidget {
  final Widget? home;

  const GridyApp({
    super.key,
    this.home,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gridy - Resident Portal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: home ?? const LoginScreen(),
    );
  }
}
