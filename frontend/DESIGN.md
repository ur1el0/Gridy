# Web design tokens

`src/index.css` is the source for KapitBayan's web color and radius values. `tailwind.config.js` exposes those values as semantic utilities used by shared controls, the admin dashboard, and queue screens.

Keep the existing `--brand-primary*` variables tenant-aware. Use `brand-admin` for the fixed official-facing navy and `brand-accent` for the resident-facing blue. Use `surface-*`, `neutral-*`, `border-*`, and `feedback-*` utilities for repeated interface roles instead of adding another literal value.

Only add a token when a value has a repeated interface role. Keep one-off chart series colors local to the chart. This keeps the token layer small and avoids turning every visual value into configuration.
