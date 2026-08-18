# Git Workflow & Version Control

All contributions to the Gridy repository must adhere to the following Git workflow to ensure a clean, trackable, and safe history.

### 1. Feature Branching Protocol
* **Rule**: No pushing directly to `main`.
* **Practice**: All development must occur on dedicated feature branches (e.g., `feature/module-name`, `fix/issue-name`). 

### 2. Pull Request (PR) Integration Workflow
* **Rule**: Changes are merged via PRs to pass CI/CD checks.
* **Practice**: Once a feature branch is ready, push it to the remote repository and open a Pull Request. Rely on the CI/CD pipelines to validate the code before merging into `main`. Provide a markdown-formatted, emoji-free PR message along with a concise description.

### 3. Concise Commit Formatting
* **Rule**: Commit messages must be informative and follow conventional commit standards.
* **Practice**: Prefix commits with `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, or `test:`. 

### 4. Atomic, Separated Commits (STRICT)
* **Rule**: Never bundle unrelated or loosely related changes into a single large commit.
* **Practice**: Separate commits logically. For example, if a feature requires backend models, API serializers, and frontend UI components, you should have separate commits:
  1. Commit for Database schema and migrations.
  2. Commit for View/Serializer API logic.
  3. Commit for Frontend React components.
