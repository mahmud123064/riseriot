/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Surfaces and text resolve through CSS variables set at runtime by
        // src/theme/ThemeProvider.tsx, so light/dark and accent changes apply
        // without rebuilding class names.
        app: {
          bg: 'var(--app-bg)',
          card: 'var(--app-card)',
          panel: 'var(--app-panel)',
          nav: 'var(--app-nav)',
          'nav-glass': 'var(--app-nav-glass)',
          border: 'var(--app-border)',

          ink: 'var(--app-ink)',
          'ink-dim': 'var(--app-ink-dim)',
          muted: 'var(--app-muted)',
          faint: 'var(--app-faint)',

          line: 'var(--app-line)',
          'line-strong': 'var(--app-line-strong)',
          surface: 'var(--app-surface)',
          'surface-strong': 'var(--app-surface-strong)',
          scrim: 'var(--app-scrim)',

          mint: 'var(--app-mint)',
          amber: 'var(--app-amber)',
          danger: 'var(--app-danger)',
          'danger-ink': 'var(--app-danger-ink)',

          accent: 'var(--app-accent)',
          'accent-strong': 'var(--app-accent-strong)',
          'accent-bright': 'var(--app-accent-bright)',
          'accent-text': 'var(--app-accent-text)',
          'accent-icon': 'var(--app-accent-icon)',
          'accent-soft': 'var(--app-accent-soft)',
          'accent-soft-alt': 'var(--app-accent-soft-alt)',
          'accent-line': 'var(--app-accent-line)',
          'accent-wash': 'var(--app-accent-wash)',
          'accent-deep': 'var(--app-accent-deep)',

          // Back-compat aliases for the original accent names.
          lilac: 'var(--app-accent-text)',
          purple: 'var(--app-accent)',
          orchid: 'var(--app-accent-strong)',
          violet: 'var(--app-accent-bright)',
        },
      },
    },
  },
  plugins: [],
}
