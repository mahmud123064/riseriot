import { Camera, Vibrate, Zap, type LucideIcon } from 'lucide-react-native'

export const CHALLENGE_IDS = ['math', 'shake', 'camera'] as const

export type ChallengeId = (typeof CHALLENGE_IDS)[number]

export function isChallengeId(value: unknown): value is ChallengeId {
  return typeof value === 'string' && (CHALLENGE_IDS as readonly string[]).includes(value)
}

export type Challenge = {
  id: ChallengeId
  label: string
  description: string
  Icon: LucideIcon
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'math',
    label: 'Math challenge',
    description: 'Solve one quick sum to stop the alarm.',
    Icon: Zap,
  },
  {
    id: 'shake',
    label: 'Shake for 5s',
    description: 'Keep shaking the phone for five seconds.',
    Icon: Vibrate,
  },
  {
    id: 'camera',
    label: 'Camera + move 5s',
    description: 'Move the phone for five seconds while the camera is on.',
    Icon: Camera,
  },
]

export function getChallenge(id: ChallengeId) {
  return CHALLENGES.find((challenge) => challenge.id === id) ?? CHALLENGES[0]
}
