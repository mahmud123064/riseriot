// Deep imports keep Metro from bundling every weight (and italic) in the package.
import { Lato_400Regular } from '@expo-google-fonts/lato/400Regular'
import { Lato_700Bold } from '@expo-google-fonts/lato/700Bold'
import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular'
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium'
import { Roboto_600SemiBold } from '@expo-google-fonts/roboto/600SemiBold'
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold'
import type { FontFamilyDefinition } from 'expo-font'

// Register every weight under one family name so `fontWeight` picks the right face
// (Android API 29+ matches on the declared weight; iOS reads each file's metadata).
export const fontFamilies: FontFamilyDefinition[] = [
  {
    fontFamily: 'Roboto',
    fontDefinitions: [
      { path: Roboto_400Regular, weight: 400 },
      { path: Roboto_500Medium, weight: 500 },
      { path: Roboto_600SemiBold, weight: 600 },
      { path: Roboto_700Bold, weight: 700 },
    ],
  },
  {
    fontFamily: 'Lato',
    fontDefinitions: [
      { path: Lato_400Regular, weight: 400 },
      { path: Lato_700Bold, weight: 700 },
    ],
  },
]

/** Roboto for UI/body copy, Lato for screen titles and large numerals. */
export const fonts = {
  body: 'Roboto',
  display: 'Lato',
} as const
