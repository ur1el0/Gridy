class FeatureFlags {
  static const bool publicNavigatorEnabled = bool.fromEnvironment(
    'PUBLIC_NAVIGATOR_ENABLED',
    defaultValue: false,
  );
}
