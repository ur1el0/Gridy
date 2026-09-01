import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';

class PushNotificationService {
  final ApiClient apiClient;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  PushNotificationService({required this.apiClient});

  /// Initializes permissions and fetches the FCM token
  Future<void> initialize() async {
    // 1. Request permission (mainly for iOS; Android 13+ also prompts)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted notification permissions.');
      await _fetchAndRegisterToken();
    } else {
      debugPrint('User declined or has not accepted notification permissions.');
    }

    // 2. Listen for token refreshes (in case the token expires)
    _messaging.onTokenRefresh.listen(_registerTokenOnBackend);
        // 3. Listen for notifications while the app is open (Foreground)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Received foreground message: ${message.notification?.title}');
      
      if (message.notification != null) {
        // Here we could trigger a local flushbar/snackbar or add to an internal notification counter.
        // For now, we will just print it to the console.
        debugPrint('Title: ${message.notification!.title}');
        debugPrint('Body: ${message.notification!.body}');
      }
    });

    // 4. Handle when a user taps a background notification to open the app
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('User tapped notification to open app: ${message.data}');
      // Here we could navigate them to a specific screen based on message.data['route']
    });
  }

  Future<void> _fetchAndRegisterToken() async {
    try {
      // Note: On Chrome/Web, this requires extra VAPID key setup.
      // It will work seamlessly on native Android/iOS.
      final token = await _messaging.getToken(
        vapidKey: 'BP9uZMIa96hTyaoGPJisSEjRjRM69TOWDQD6TYQCKxE8weHrwVA7Oa85-h6rYu-BPS-A_q287LJ6_CTYqDQcEmY',
      );
      if (token != null) {
        debugPrint('FCM Token generated: $token');
        await _registerTokenOnBackend(token);
      }
    } catch (e) {
      debugPrint('Failed to fetch FCM token (expected if testing on Web without VAPID keys): $e');
    }
  }

  Future<void> _registerTokenOnBackend(String token) async {
    try {
      await apiClient.post(
        '/devices/', 
        body: {'token': token},
        requiresAuth: true, // Must be logged in to register a device
      );
      debugPrint('Successfully registered device token on Django backend.');
    } catch (e) {
      debugPrint('Failed to register device on backend: $e');
    }
  }
}