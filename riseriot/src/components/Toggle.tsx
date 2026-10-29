import { Pressable, View } from 'react-native'

export function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label ?? (active ? 'Disable alarm' : 'Enable alarm')}
      accessibilityState={{ checked: active }}
      onPress={onClick}
      className={`h-7 w-12 rounded-full ${active ? 'bg-app-accent-strong' : 'bg-app-surface-strong'}`}
    >
      <View
        className={`absolute top-1 h-5 w-5 rounded-full ${
          active ? 'left-6 bg-white' : 'left-1 bg-app-muted'
        }`}
      />
    </Pressable>
  )
}
