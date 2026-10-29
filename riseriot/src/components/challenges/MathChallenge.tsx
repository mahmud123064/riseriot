import { useMemo, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { fonts } from '../../theme/fonts'
import { useTheme } from '../../theme/ThemeProvider'
import { Text } from '../Text'

type Problem = {
  prompt: string
  answer: number
}

function createProblem(): Problem {
  const a = 3 + Math.floor(Math.random() * 12)
  const b = 2 + Math.floor(Math.random() * 10)
  if (Math.random() < 0.5) {
    return { prompt: `${a} + ${b}`, answer: a + b }
  }
  const [high, low] = a >= b ? [a, b] : [b, a]
  return { prompt: `${high} − ${low}`, answer: high - low }
}

export function MathChallenge({ onComplete }: { onComplete: () => void }) {
  const { tokens } = useTheme()
  const [problem, setProblem] = useState<Problem>(createProblem)
  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)

  const canSubmit = useMemo(() => answer.trim().length > 0, [answer])

  function submit() {
    const value = Number.parseInt(answer, 10)
    if (value === problem.answer) {
      onComplete()
      return
    }
    setWrong(true)
    setAnswer('')
    setProblem(createProblem())
  }

  return (
    <View className="items-center gap-6">
      <View className="items-center gap-2">
        <Text className="text-xs font-medium uppercase tracking-[.18em] text-app-muted">
          Solve to stop
        </Text>
        <Text
          variant="display"
          className="text-6xl font-bold tracking-[-.03em] text-app-ink"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {problem.prompt}
        </Text>
      </View>

      <TextInput
        accessibilityLabel="Answer"
        value={answer}
        onChangeText={(next) => {
          setAnswer(next.replace(/[^0-9-]/g, ''))
          setWrong(false)
        }}
        onSubmitEditing={submit}
        keyboardType="number-pad"
        returnKeyType="done"
        placeholder="?"
        placeholderTextColor={tokens.faint}
        autoFocus
        className="w-40 rounded-2xl border border-app-line bg-app-surface px-4 py-3 text-center text-2xl text-app-ink"
        style={{ fontFamily: fonts.body }}
      />

      {wrong ? (
        <Text className="text-sm text-app-danger-ink">
          Not quite — here is a fresh one.
        </Text>
      ) : (
        <Text className="text-sm text-app-muted">Type the answer, then press done.</Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Submit answer"
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={submit}
        className={`w-full items-center rounded-2xl py-4 ${
          canSubmit ? 'bg-app-accent-strong' : 'bg-app-surface-strong'
        }`}
      >
        <Text className={`text-sm font-bold ${canSubmit ? 'text-white' : 'text-app-faint'}`}>
          Submit answer
        </Text>
      </Pressable>
    </View>
  )
}
