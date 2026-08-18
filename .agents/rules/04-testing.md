# Testing Protocol (TDD)

Gridy adheres to a strict test-driven development protocol to ensure high reliability across all platforms.

### 1. Backend Coverage (Django)
* **Rule**: Every new Django ViewSet or endpoint must have accompanying tests verifying functionality and security.
* **Practice**: Write tests using `pytest` and Django's test client. 
* **Requirements**:
  * Positive Functionality: Ensure the view correctly processes valid requests.
  * Negative Permission Barriers: Ensure the view properly rejects unauthorized users (e.g., residents attempting admin actions, or unauthenticated requests).

### 2. Frontend Coverage (React)
* **Rule**: Every new React page and complex component must include tests.
* **Practice**: Use `Vitest` and `React Testing Library`.
* **Requirements**:
  * Verify that core DOM elements render successfully.
  * Test critical user interactions (clicks, form submissions) using mocked API handlers (e.g., `vi.mock`).
  * Ensure loading states and error states are properly handled and displayed.
