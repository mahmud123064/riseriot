import { vars } from 'nativewind'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { StyleSheet, View, useColorScheme as useSystemColorScheme } from 'react-native'

import { getTheme, loadTheme, setThemeAccent, setThemeMode, subscribeTheme } from '../store/theme'
import {
  resolveTokens,
  toThemeVariables,
  type AccentId,
  type ThemeMode,
  type ThemeTokens,
} from './palettes'

type ThemeContextValue = {
  mode: ThemeMode
  accent: AccentId
  tokens: ThemeTokens
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribeTheme, getTheme, getTheme)
  const systemScheme = useSystemColorScheme()

  useEffect(() => {
    void loadTheme()
  }, [])

  const isDark =
    stored.mode === 'system' ? systemScheme !== 'light' : stored.mode === 'dark'
  const tokens = useMemo(() => resolveTokens(isDark, stored.accent), [isDark, stored.accent])
  const variableStyle = useMemo(() => vars(toThemeVariables(tokens)), [tokens])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: stored.mode,
      accent: stored.accent,
      tokens,
      setMode: setThemeMode,
      setAccent: setThemeAccent,
    }),
    [stored.mode, stored.accent, tokens],
  )

  return (
    <ThemeContext.Provider value={value}>
      <View style={[styles.root, variableStyle]} className="bg-app-bg">
        {children}
      </View>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider')
  }
  return context
}

/** Shorthand for components that only need resolved colors. */
export function useThemeTokens() {
  return useTheme().tokens
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
