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
      className={`h-7 w-12 rounded-full ${active ? 'bg-app-purple' : 'bg-white/15'}`}
    >
      <View
        className={`absolute top-1 h-5 w-5 rounded-full bg-white ${active ? 'left-6' : 'left-1'}`}
      />
    </Pressable>
  )
}
