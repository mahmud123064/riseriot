import { StyleSheet, Text, View } from 'react-native'

/**
 * Shown while the app boots (fonts + saved-state load). Self-contained on purpose:
 * it renders before ThemeProvider is mounted, so it cannot depend on theme tokens.
 */
export function LoadingScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>😊</Text>
      <Text style={styles.label}>Please wait…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0d091a',
  },
  emoji: { fontSize: 56 },
  label: { color: '#faf8ff', fontSize: 16 },
})
