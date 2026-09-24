import { getAvatarOption } from '@/lib/avatars'

// Shared render for a chosen avatar — used by the onboarding picker and the
// small header icon, so both stay pixel-identical.
export function AvatarIcon({
  avatarId,
  size = 32,
}: {
  avatarId: string | null | undefined
  size?: number
}) {
  const { bg, pattern } = getAvatarOption(avatarId)

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: bg }}
      aria-hidden="true"
    >
      {pattern === 'ring' ? (
        <span
          className="absolute inset-[22%] rounded-full border"
          style={{ borderColor: 'rgba(255,255,255,0.55)' }}
        />
      ) : null}
      {pattern === 'dot' ? (
        <span
          className="absolute right-[22%] top-[22%] h-[22%] w-[22%] rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.65)' }}
        />
      ) : null}
      {pattern === 'half' ? (
        <span
          className="absolute inset-y-0 right-0 w-1/2"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
        />
      ) : null}
    </span>
  )
}
