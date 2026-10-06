/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          hover: 'var(--brand-primary-hover)',
          foreground: 'var(--brand-primary-foreground)',
          text: 'var(--brand-primary-text)',
        },
        brand: {
          admin: 'rgb(var(--gridy-color-brand-admin-rgb) / <alpha-value>)',
          'admin-hover': 'var(--gridy-color-brand-admin-hover)',
          accent: 'rgb(var(--gridy-color-brand-accent-rgb) / <alpha-value>)',
          'accent-hover': 'var(--gridy-color-brand-accent-hover)',
        },
        background: {
          DEFAULT: 'rgb(var(--gridy-color-canvas-rgb) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'var(--gridy-color-surface)',
          subtle: 'var(--gridy-color-surface-subtle)',
          input: 'var(--gridy-color-surface-input)',
          form: 'rgb(var(--gridy-color-surface-form-rgb) / <alpha-value>)',
          table: 'rgb(var(--gridy-color-surface-table-rgb) / <alpha-value>)',
          queue: 'var(--gridy-color-surface-queue)',
          waiting: 'var(--gridy-color-surface-waiting)',
        },
        border: {
          DEFAULT: 'rgb(var(--gridy-color-border-rgb) / <alpha-value>)',
          strong: 'var(--gridy-color-border-strong)',
        },
        neutral: {
          primary: 'var(--gridy-color-text-primary)',
          secondary: 'var(--gridy-color-text-secondary)',
          'secondary-strong': 'var(--gridy-color-text-secondary-strong)',
          muted: 'var(--gridy-color-text-muted)',
          hint: 'var(--gridy-color-text-hint)',
        },
        feedback: {
          'success-soft': 'var(--gridy-color-surface-success)',
          'success-pale': 'var(--gridy-color-surface-success-pale)',
          'success-strong': 'var(--gridy-color-success-strong)',
          'success-deep': 'var(--gridy-color-success-deep)',
          'warning-soft': 'var(--gridy-color-surface-warning)',
          warning: 'var(--gridy-color-warning)',
          'danger-soft': 'var(--gridy-color-surface-danger)',
          'danger-text-strong': 'var(--gridy-color-danger-text-strong)',
          danger: 'var(--gridy-color-danger)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        small: 'var(--gridy-radius-small)',
        medium: 'var(--gridy-radius-medium)',
        large: 'var(--gridy-radius-large)',
        pill: 'var(--gridy-radius-pill)',
      },
    },
  },
  plugins: [],
}
