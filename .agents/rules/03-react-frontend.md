# React Frontend Guidelines

### 1. Premium & Responsive Design Aesthetics
* **Rule**: The UI must follow modern, high-quality design standards (TailwindCSS).
* **Practice**: 
  * Use responsive Tailwind classes (`md:`, `lg:`) to ensure layouts adapt to all screen sizes.
  * Enforce clean, modern aesthetics: use hover effects, subtle micro-animations, and styled components. Do not use generic, unstyled HTML default buttons or inputs.
  * Avoid raw CSS where Tailwind utility classes can achieve the same result.

### 2. Accessibility (a11y) First
* **Rule**: All components must be usable by assistive technologies.
* **Practice**: 
  * Enforce the use of ARIA labels (`aria-label`, `aria-hidden`) on non-text elements like icons or visual buttons.
  * Ensure semantic HTML is used (`<nav>`, `<main>`, `<article>`).
  * Verify keyboard navigability (`tabindex`, focus states) for every new interactive UI component built.

### 3. Dependency Management
* **Rule**: No manual edits to lockfiles.
* **Practice**: Never manually edit `package-lock.json` or `yarn.lock` to resolve conflicts. Always run `npm install` to regenerate it cleanly.
