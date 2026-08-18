# Django Backend Guidelines

Enforce these secure coding practices across all backend features to guarantee system integrity:

### 1. Granular View Permissions (RBAC)
* **Rule**: Never use a blanket `IsAuthenticated` permission class on `ModelViewSet` classes containing administrative capabilities.
* **Practice**: Always override `get_permissions(self)` to split permissions based on the active `self.action`:
  * Read/Write actions for residents (`list`, `retrieve`, `create`): require `IsAuthenticated`.
  * Administrative modifications (`update`, `partial_update`, `destroy`): require `IsBarangayOfficial`.

### 2. Creation-State Parameter Overrides
* **Rule**: Clients must never be able to define status variables, administrative comments, or user assignments when submitting new records.
* **Practice**: Explicitly intercept values inside the ViewSet's `perform_create()` method, overriding client parameters to default states:
  * Force `status` to `PENDING` during save.
  * Clear administrative fields (e.g. `admin_notes=""`).
  * Force owner mappings (e.g. `user=self.request.user`).

### 3. Queryset Isolation (Data Exposure Prevention)
* **Rule**: Avoid using standard `objects.all()` queries for resident-owned details.
* **Practice**: Always override `get_queryset(self)` to filter records by the logged-in user profile, restricting access to the user's own records while allowing administrators full list access:
  ```python
  def get_queryset(self):
      user = self.request.user
      if user.role == User.Role.ADMIN:
          return Model.objects.all().order_by('-created_at')
      return Model.objects.filter(user=user).order_by('-created_at')
  ```

### 4. Database Migration Safety
* **Rule**: No Manual Schema Edits.
* **Practice**: Never alter the database schema using raw SQL. Always use `python manage.py makemigrations` and review the generated migration file before applying it.

### 5. Synthetic Data & Seeding Integrity
* **Rule**: Avoid manual or raw SQL database seeding.
* **Practice**: Define and maintain schema-validated JSON fixtures for system seeding (including default roles, clearance templates, and bulletin announcements).

### 6. Code Quality & Import Audits
* **Rule**: Keep imports clean and code warning-free.
* **Practice**: Remove any unused module imports (like `URLPattern` or unreferenced models). Periodically run `python manage.py check` to ensure clean compiles with zero warnings.
