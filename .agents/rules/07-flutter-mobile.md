# Flutter Mobile Architecture & Layer Separation Guidelines

This document defines the architectural standards, layer separation principles, and role-based routing protocols for the KapitBayan Flutter mobile application.

---

## 1. Architectural Layer Separation

The mobile application enforces a strict separation of concerns across four discrete layers:

```text
mobile/lib/
├── core/         # Network client (ApiClient), exceptions, and theme tokens
├── models/       # Immutable data models, JSON serialization, and getters
├── services/     # API communication, token persistence, and hardware integration
├── screens/      # Full-page layout widgets and navigation controllers
└── widgets/      # Reusable sub-components, dialogs, and atomic UI elements
```

### Layer Rules
1. **Purely Declarative UI (`screens/`, `widgets/`):**
   * Widgets must remain strictly declarative.
   * Never execute raw HTTP requests (`http.get`, `http.post`) or complex business logic directly inside `onPressed`, `onTap`, or event handlers.
   * All API calls and mutations must delegate to a dedicated service class (e.g., `IssueService`, `FieldOfficialService`, `DocumentService`).
2. **Modular Components (No God Widgets):**
   * Screen widgets must focus on page scaffolding and state orchestration.
   * Complex segments (detail dialogs, status badges, metrics cards, table rows) must be extracted into dedicated widgets under `lib/widgets/`.
3. **Defensive Model Serialization (`models/`):**
   * Always provide type-safe `fromJson` and `toJson` methods.
   * Defensively cast numeric and monetary fields (e.g., `(json['fee_amount'] as num?)?.toDouble() ?? 0.0`).
   * Provide computed presentation getters (e.g., `formattedFee`, `roleDisplay`).

---

## 2. Defensive Service Layer Unpacking

Django REST Framework endpoints may return either paginated envelopes or raw unpaginated lists depending on filtering or actions. All service methods must defensively parse both formats:

```dart
final dynamic data = response.data;
final List<dynamic> rawList;
if (data is Map<String, dynamic> && data.containsKey('results')) {
  rawList = data['results'] as List<dynamic>;
} else if (data is List<dynamic>) {
  rawList = data;
} else {
  rawList = [];
}
return rawList.map((item) => Model.fromJson(item as Map<String, dynamic>)).toList();
```

---

## 3. Role-Based Navigation & Portal Isolation

The mobile client routes users into isolated functional portals based on their RBAC tier immediately upon authentication:

```dart
Widget destinationScreen;
if (user.role.toUpperCase() == 'FIELD_OFFICIAL') {
  // Tier 3: Roving Tanod & Field Operations
  destinationScreen = const FieldOfficialScreen();
} else if (user.isOfficial) {
  // Tier 2: Barangay Executive Administration
  destinationScreen = const AdminDashboardScreen();
} else {
  // Tier 4: Citizen Resident Services
  destinationScreen = const DashboardScreen();
}

Navigator.of(context).pushReplacement(
  MaterialPageRoute(builder: (_) => destinationScreen),
);
```

### Secret Authority Barrier
* Mobile navigation selects role-appropriate screens after authentication; the current app does not implement a hidden long-press authority mode.
* Do not add hidden role-switch gestures without a reviewed product/security decision.
* Backend permissions remain authoritative even when the mobile client hides role-inappropriate actions.

---

## 4. UI Layout & Viewport Safety

1. **Prevent RenderFlex Overflows:**
   * Never wrap growing forms in unbounded vertical columns without scroll physics.
   * Always wrap interactive forms in `LayoutBuilder`, `SingleChildScrollView`, `ConstrainedBox`, and `IntrinsicHeight` so the layout adapts seamlessly when the on-screen keyboard appears.
2. **A11y & Contrast:**
   * Ensure contrast ratios adhere to mobile WCAG baselines.
   * Provide accessible semantics labels and touch targets with a minimum height of 48x48 logical pixels.

---

## 5. Verification & Testing Standards

Before committing any changes to the mobile codebase:
```bash
cd mobile
dart analyze    # Must pass with 0 errors and 0 warnings
flutter test    # All unit and widget tests must pass
```
