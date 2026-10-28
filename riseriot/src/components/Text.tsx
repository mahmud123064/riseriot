import { Text as RNText, StyleSheet, type TextProps } from 'react-native'

import { fonts } from '../theme/fonts'

type AppTextProps = TextProps & {
  /** `display` uses Lato for headings and large numerals; `body` uses Roboto everywhere else. */
  variant?: 'body' | 'display'
}

export function Text({ variant = 'body', style, ...props }: AppTextProps) {
  return (
    <RNText style={[variant === 'display' ? styles.display : styles.body, style]} {...props} />
  )
}

const styles = StyleSheet.create({
  body: { fontFamily: fonts.body },
  display: { fontFamily: fonts.display },
})
