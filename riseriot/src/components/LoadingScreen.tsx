import { Image, StyleSheet, Text, View } from 'react-native'

/**
 * Shown while the app boots (fonts + saved-state load). Self-contained on purpose:
 * it renders before ThemeProvider is mounted, so it cannot depend on theme tokens.
 */
export function LoadingScreen() {
  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brandTitle}>RiseRiot</Text>
      <Text style={styles.label}>Rise & riot against sleep…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d091a',
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 24,
    marginBottom: 8,
  },
  brandTitle: {
    color: '#faf8ff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  label: {
    color: '#bda6d8',
    fontSize: 14,
  },
})
