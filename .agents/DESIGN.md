# Gridy - Design & Aesthetics

## 1. Visual Aesthetics
- **Premium Feel**: Gridy must look like a high-end enterprise application, not a basic student project.
- **Color Palette**: Use Tailwind CSS defaults with strategic branding colors (e.g., deep Indigo/Blue for primary actions, Emerald for success, Rose for destructive actions).
- **Glassmorphism & Depth**: Utilize subtle shadows (`shadow-sm`, `shadow-md`), blurring, and soft border styling to create visual hierarchy.

## 2. Interaction Design
- **Micro-Animations**: All interactive elements (buttons, links, table rows) must have `transition-colors` or `transition-all` on hover states.
- **Loading States**: Never leave the user wondering if a request is processing. Use skeleton loaders or disabled buttons with "Updating..." text during asynchronous operations.
- **Modals & Slide-overs**: Use smooth entry and exit transitions for all modals. Provide clear "Close" actions.

## 3. Component Standards
- **Buttons**: Must NOT be generic. Use `px-4 py-2 rounded-md font-medium text-sm`. Primary buttons should have solid backgrounds; secondary buttons should have outlines.
- **Badges**: Status indicators must use distinct background and text colors (e.g., `bg-yellow-100 text-yellow-800` for Pending).

## 4. Typography
- Use standard Inter/Roboto web fonts via Tailwind. Ensure high contrast between text and backgrounds (e.g., `text-slate-900` for headers, `text-slate-500` for sub-text).
