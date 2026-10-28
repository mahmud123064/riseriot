import { Keyboard, Watch, Zap, type LucideIcon } from 'lucide-react-native'

import type { ChallengeId } from '../store/alarms'

export type Challenge = {
  id: ChallengeId
  label: string
  Icon: LucideIcon
}

export const CHALLENGES: Challenge[] = [
  { id: 'math', label: 'Math challenge', Icon: Zap },
  { id: 'shake', label: 'Shake it off', Icon: Watch },
  { id: 'typing', label: 'Type to stop', Icon: Keyboard },
]

export function getChallenge(id: ChallengeId) {
  return CHALLENGES.find((challenge) => challenge.id === id) ?? CHALLENGES[0]
}
