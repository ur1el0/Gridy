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
          admin: 'rgb(var(--kapitbayan-color-brand-admin-rgb) / <alpha-value>)',
          'admin-hover': 'var(--kapitbayan-color-brand-admin-hover)',
          accent: 'rgb(var(--kapitbayan-color-brand-accent-rgb) / <alpha-value>)',
          'accent-hover': 'var(--kapitbayan-color-brand-accent-hover)',
        },
        background: {
          DEFAULT: 'rgb(var(--kapitbayan-color-canvas-rgb) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'var(--kapitbayan-color-surface)',
          subtle: 'var(--kapitbayan-color-surface-subtle)',
          input: 'var(--kapitbayan-color-surface-input)',
          form: 'rgb(var(--kapitbayan-color-surface-form-rgb) / <alpha-value>)',
          table: 'rgb(var(--kapitbayan-color-surface-table-rgb) / <alpha-value>)',
          queue: 'var(--kapitbayan-color-surface-queue)',
          waiting: 'var(--kapitbayan-color-surface-waiting)',
        },
        border: {
          DEFAULT: 'rgb(var(--kapitbayan-color-border-rgb) / <alpha-value>)',
          strong: 'var(--kapitbayan-color-border-strong)',
        },
        neutral: {
          primary: 'var(--kapitbayan-color-text-primary)',
          secondary: 'var(--kapitbayan-color-text-secondary)',
          'secondary-strong': 'var(--kapitbayan-color-text-secondary-strong)',
          muted: 'var(--kapitbayan-color-text-muted)',
          hint: 'var(--kapitbayan-color-text-hint)',
        },
        feedback: {
          'success-soft': 'var(--kapitbayan-color-surface-success)',
          'success-pale': 'var(--kapitbayan-color-surface-success-pale)',
          'success-strong': 'var(--kapitbayan-color-success-strong)',
          'success-deep': 'var(--kapitbayan-color-success-deep)',
          'warning-soft': 'var(--kapitbayan-color-surface-warning)',
          warning: 'var(--kapitbayan-color-warning)',
          'danger-soft': 'var(--kapitbayan-color-surface-danger)',
          'danger-text-strong': 'var(--kapitbayan-color-danger-text-strong)',
          danger: 'var(--kapitbayan-color-danger)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        small: 'var(--kapitbayan-radius-small)',
        medium: 'var(--kapitbayan-radius-medium)',
        large: 'var(--kapitbayan-radius-large)',
        pill: 'var(--kapitbayan-radius-pill)',
      },
    },
  },
  plugins: [],
}
