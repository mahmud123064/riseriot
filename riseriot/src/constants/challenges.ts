import { Activity, Dumbbell, PartyPopper, Zap, type LucideIcon } from 'lucide-react-native'

export const CHALLENGE_IDS = ['math', 'pushup', 'dance', 'movement'] as const

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
    id: 'pushup',
    label: 'Push-up challenge',
    description: 'Do 5 push-ups in front of the camera with live stick figure tracking.',
    Icon: Dumbbell,
  },
  {
    id: 'dance',
    label: 'Dance challenge',
    description: 'Dance and groove in front of the camera for 5 seconds to wake up.',
    Icon: PartyPopper,
  },
  {
    id: 'movement',
    label: 'Body movement',
    description: 'Move your body (exercise, stretch) in front of the camera for 5 seconds.',
    Icon: Activity,
  },
]

export function getChallenge(id: ChallengeId) {
  return CHALLENGES.find((challenge) => challenge.id === id) ?? CHALLENGES[0]
}
