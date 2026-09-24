export type AvatarPattern = 'solid' | 'ring' | 'dot' | 'half'

export type AvatarOption = {
  id: string
  bg: string
  pattern: AvatarPattern
}

// Fixed, non-uploadable avatar options offered once during onboarding
// (pasted spec — no CLAUDE.md chapter number for this one). Muted, editorial
// tones rather than bright green/orange/red, so a chosen avatar never reads
// as a status color elsewhere in the app (§4.2).
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'dusty-blue', bg: '#5B7FA6', pattern: 'ring' },
  { id: 'taupe', bg: '#A68A6D', pattern: 'dot' },
  { id: 'sage', bg: '#7C8B6F', pattern: 'half' },
  { id: 'charcoal', bg: '#4B4B4E', pattern: 'solid' },
  { id: 'clay', bg: '#B08268', pattern: 'ring' },
  { id: 'slate', bg: '#8B94A3', pattern: 'dot' },
  { id: 'plum', bg: '#7A6C8B', pattern: 'half' },
  { id: 'sand', bg: '#BFA05A', pattern: 'solid' },
]

export const DEFAULT_AVATAR_ID = AVATAR_OPTIONS[0].id

export function getAvatarOption(avatarId: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((option) => option.id === avatarId) ?? AVATAR_OPTIONS[0]
}
