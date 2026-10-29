export type ThemeMode = 'light' | 'dark' | 'system'

export type AccentId = 'purple' | 'orchid' | 'blue' | 'teal' | 'amber'

type ModePalette = {
  bg: string
  card: string
  panel: string
  nav: string
  navGlass: string
  border: string
  ink: string
  inkDim: string
  muted: string
  faint: string
  line: string
  lineStrong: string
  surface: string
  surfaceStrong: string
  scrim: string
  mint: string
  amber: string
  danger: string
  dangerInk: string
}

type AccentPalette = {
  label: string
  primary: string
  strong: string
  bright: string
  textDark: string
  textLight: string
  iconDark: string
  iconLight: string
  soft: string
  softAlt: string
  line: string
  wash: string
  deepDark: string
  deepLight: string
  hero: readonly [string, string, string]
  bar: readonly [string, string]
  shadow: string
}

export const MODE_PALETTES: Record<'light' | 'dark', ModePalette> = {
  dark: {
    bg: '#0d091a',
    card: '#211a3a',
    panel: '#171129',
    nav: '#100b20',
    navGlass: 'rgba(16,11,32,0.95)',
    border: '#6d4a9c',
    ink: '#faf8ff',
    inkDim: 'rgba(250,248,255,0.40)',
    muted: '#bda6d8',
    faint: 'rgba(250,248,255,0.35)',
    line: 'rgba(255,255,255,0.10)',
    lineStrong: 'rgba(255,255,255,0.18)',
    surface: 'rgba(255,255,255,0.05)',
    surfaceStrong: 'rgba(255,255,255,0.10)',
    scrim: 'rgba(0,0,0,0.65)',
    mint: '#49e2ae',
    amber: '#ffba70',
    danger: '#ff5c5c',
    dangerInk: '#ff8a8a',
  },
  light: {
    bg: '#f3edff',
    card: '#ffffff',
    panel: '#faf7ff',
    nav: '#f7f1ff',
    navGlass: 'rgba(247,241,255,0.95)',
    border: '#c9b4e6',
    ink: '#221636',
    inkDim: 'rgba(34,22,54,0.45)',
    muted: '#6b5a86',
    faint: 'rgba(34,22,54,0.50)',
    line: 'rgba(34,22,54,0.10)',
    lineStrong: 'rgba(34,22,54,0.18)',
    surface: 'rgba(34,22,54,0.04)',
    surfaceStrong: 'rgba(34,22,54,0.08)',
    scrim: 'rgba(20,10,35,0.45)',
    mint: '#0f9d78',
    amber: '#b7791f',
    danger: '#d63b3b',
    dangerInk: '#c02d2d',
  },
}

export const ACCENTS: Record<AccentId, AccentPalette> = {
  purple: {
    label: 'Purple',
    primary: '#9b61ff',
    strong: '#a969ff',
    bright: '#b879ff',
    textDark: '#d6b7ff',
    textLight: '#6d28d9',
    iconDark: '#ce9dff',
    iconLight: '#6d28d9',
    soft: 'rgba(155,97,255,0.20)',
    softAlt: 'rgba(155,97,255,0.25)',
    line: 'rgba(155,97,255,0.55)',
    wash: 'rgba(123,80,237,0.25)',
    deepDark: '#3c2370',
    deepLight: '#ede4ff',
    hero: ['#9b61ff', '#6740b3', '#30225f'],
    bar: ['#7745e9', '#b77aff'],
    shadow: '#6f40d2',
  },
  orchid: {
    label: 'Orchid',
    primary: '#e04fb0',
    strong: '#e85fc0',
    bright: '#f07ad2',
    textDark: '#f4b8e1',
    textLight: '#b0177d',
    iconDark: '#f4a9d8',
    iconLight: '#b0177d',
    soft: 'rgba(224,79,176,0.20)',
    softAlt: 'rgba(224,79,176,0.25)',
    line: 'rgba(224,79,176,0.55)',
    wash: 'rgba(200,60,150,0.25)',
    deepDark: '#4a1a3a',
    deepLight: '#fbe6f4',
    hero: ['#e04fb0', '#a3327c', '#4c1b3c'],
    bar: ['#c23b93', '#f07ad2'],
    shadow: '#b02d84',
  },
  blue: {
    label: 'Blue',
    primary: '#4f88ff',
    strong: '#5b96ff',
    bright: '#79acff',
    textDark: '#b8d0ff',
    textLight: '#1d4ed8',
    iconDark: '#a9c6ff',
    iconLight: '#1d4ed8',
    soft: 'rgba(79,136,255,0.20)',
    softAlt: 'rgba(79,136,255,0.25)',
    line: 'rgba(79,136,255,0.55)',
    wash: 'rgba(60,110,230,0.25)',
    deepDark: '#1b2b5c',
    deepLight: '#e3ecff',
    hero: ['#4f88ff', '#3159b3', '#182a5c'],
    bar: ['#3f6fdd', '#79acff'],
    shadow: '#2f5cd0',
  },
  teal: {
    label: 'Teal',
    primary: '#14b8a6',
    strong: '#1fcbb7',
    bright: '#45ddc9',
    textDark: '#9ff0e4',
    textLight: '#0f766e',
    iconDark: '#8fe8dc',
    iconLight: '#0f766e',
    soft: 'rgba(20,184,166,0.20)',
    softAlt: 'rgba(20,184,166,0.25)',
    line: 'rgba(20,184,166,0.55)',
    wash: 'rgba(15,150,135,0.25)',
    deepDark: '#0f3f3a',
    deepLight: '#dffaf5',
    hero: ['#14b8a6', '#0f7d72', '#0b3b36'],
    bar: ['#12a594', '#45ddc9'],
    shadow: '#0f9488',
  },
  amber: {
    label: 'Amber',
    primary: '#f59e0b',
    strong: '#ffb020',
    bright: '#ffc452',
    textDark: '#ffe0a8',
    textLight: '#b45309',
    iconDark: '#ffd28a',
    iconLight: '#b45309',
    soft: 'rgba(245,158,11,0.20)',
    softAlt: 'rgba(245,158,11,0.25)',
    line: 'rgba(245,158,11,0.55)',
    wash: 'rgba(210,140,10,0.25)',
    deepDark: '#4a3413',
    deepLight: '#fff3dc',
    hero: ['#f59e0b', '#b37408', '#4d3305'],
    bar: ['#e08f08', '#ffc452'],
    shadow: '#c47c07',
  },
}

export const ACCENT_OPTIONS = (Object.keys(ACCENTS) as AccentId[]).map((id) => ({
  id,
  label: ACCENTS[id].label,
  swatch: ACCENTS[id].primary,
}))

export type ThemeTokens = ModePalette & {
  isDark: boolean
  accent: string
  accentStrong: string
  accentBright: string
  accentText: string
  accentIcon: string
  accentSoft: string
  accentSoftAlt: string
  accentLine: string
  accentWash: string
  accentDeep: string
  heroGradient: readonly [string, string, string]
  barGradient: readonly [string, string]
  heroShadow: {
    shadowColor: string
    shadowOffset: { width: number; height: number }
    shadowOpacity: number
    shadowRadius: number
    elevation: number
  }
}

export function resolveTokens(isDark: boolean, accentId: AccentId): ThemeTokens {
  const mode = MODE_PALETTES[isDark ? 'dark' : 'light']
  const accent = ACCENTS[accentId]
  return {
    ...mode,
    isDark,
    accent: accent.primary,
    accentStrong: accent.strong,
    accentBright: accent.bright,
    accentText: isDark ? accent.textDark : accent.textLight,
    accentIcon: isDark ? accent.iconDark : accent.iconLight,
    accentSoft: accent.soft,
    accentSoftAlt: accent.softAlt,
    accentLine: accent.line,
    accentWash: accent.wash,
    accentDeep: isDark ? accent.deepDark : accent.deepLight,
    heroGradient: accent.hero,
    barGradient: accent.bar,
    heroShadow: {
      shadowColor: accent.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.28 : 0.2,
      shadowRadius: 30,
      elevation: 12,
    },
  }
}

/** CSS variables consumed by the `app.*` colors in `tailwind.config.js`. */
export function toThemeVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    '--app-bg': tokens.bg,
    '--app-card': tokens.card,
    '--app-panel': tokens.panel,
    '--app-nav': tokens.nav,
    '--app-nav-glass': tokens.navGlass,
    '--app-border': tokens.border,
    '--app-ink': tokens.ink,
    '--app-ink-dim': tokens.inkDim,
    '--app-muted': tokens.muted,
    '--app-faint': tokens.faint,
    '--app-line': tokens.line,
    '--app-line-strong': tokens.lineStrong,
    '--app-surface': tokens.surface,
    '--app-surface-strong': tokens.surfaceStrong,
    '--app-scrim': tokens.scrim,
    '--app-mint': tokens.mint,
    '--app-amber': tokens.amber,
    '--app-danger': tokens.danger,
    '--app-danger-ink': tokens.dangerInk,
    '--app-accent': tokens.accent,
    '--app-accent-strong': tokens.accentStrong,
    '--app-accent-bright': tokens.accentBright,
    '--app-accent-text': tokens.accentText,
    '--app-accent-icon': tokens.accentIcon,
    '--app-accent-soft': tokens.accentSoft,
    '--app-accent-soft-alt': tokens.accentSoftAlt,
    '--app-accent-line': tokens.accentLine,
    '--app-accent-wash': tokens.accentWash,
    '--app-accent-deep': tokens.accentDeep,
  }
}
