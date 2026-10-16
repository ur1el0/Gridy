# KapitBayan Mobile App

The Flutter app provides resident self-service and supported field workflows for Android and other Flutter targets. These instructions cover local development and physical-device connectivity.

## Prerequisites

- Flutter SDK and Android SDK installed.
- An Android emulator or a phone with USB debugging / Wireless debugging enabled.
- The local Django API running on port `8000`. Start it with either the root README's [Docker Compose quickstart](../README.md#local-development-with-docker-compose) or [host development setup](../README.md#run-clients-without-docker). Local device testing should use the local development database, not the Neon production database.

Fetch packages and list Flutter targets:

```bash
cd mobile
flutter pub get
flutter devices
```

## Run on an Android emulator

The debug app defaults to `http://10.0.2.2:8000/api/v1`, which routes emulator requests to the development machine:

```bash
cd mobile
flutter run -d DEVICE_ID
```

Replace `DEVICE_ID` with the emulator ID shown by `flutter devices`.

## Run on a physical Android phone over USB

Connect and unlock the phone, enable USB debugging, and accept the computer authorization prompt. Confirm the device is listed:

```bash
adb devices
flutter devices
```

Forward the phone's port `8000` to Django on the computer:

```bash
adb reverse tcp:8000 tcp:8000
```

Run the app with the forwarded loopback address. This override is needed because `10.0.2.2` is for an emulator:

```bash
cd mobile
flutter run -d DEVICE_ID --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/v1
```

If the phone is no longer connected after changing cables or USB settings, repeat `adb devices` and `adb reverse`.

## Run over Wi-Fi

Use this when the phone and computer share a trusted Wi-Fi network. On the phone, open **Developer options → Wireless debugging**, turn it on, and use the pairing port shown under **Pair device with pairing code**:

```bash
adb pair PHONE_IP:PAIRING_PORT
adb devices -l
```

If the phone does not appear after pairing, connect using the separate IP and port shown on the main Wireless debugging screen:

```bash
adb connect PHONE_IP:WIRELESS_DEBUGGING_PORT
adb devices -l
```

The mobile app must use the computer's LAN IP, and Django must be bound to `0.0.0.0:8000`; allow the LAN IP in `ALLOWED_HOSTS` and permit port `8000` through the local firewall.

```bash
cd mobile
flutter run -d DEVICE_ID --dart-define=API_BASE_URL=http://192.168.1.25:8000/api/v1
```

Replace `DEVICE_ID`, `PHONE_IP`, `PAIRING_PORT`, and `WIRELESS_DEBUGGING_PORT` with the values shown by Flutter and Android Wireless debugging. Replace the example LAN IP `192.168.1.25` with the computer's current IP. The phone's IP and ADB wireless ports may change when Wi-Fi or Wireless debugging restarts.

## Verify the mobile app

```bash
cd mobile
flutter analyze
flutter test
```

Use the [mobile barangay pilot test flow](../docs/testing/mobile-barangay-pilot-flow.md) for role-based, connectivity, accessibility, and release-candidate checks. Do not treat a screen opening as proof that the associated API workflow passed.

## Related project docs

- [Root README and application quickstart](../README.md)
- [System overview](../architecture/01-system-overview.md)
- [Testing and QA matrix](../architecture/10-testing-and-qa-iso25010.md)
