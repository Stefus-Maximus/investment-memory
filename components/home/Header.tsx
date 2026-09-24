import Link from 'next/link'

import { AvatarIcon } from '@/components/AvatarIcon'

export function Header({
  name,
  hasLessons,
  avatarId,
}: {
  name: string | null
  hasLessons: boolean
  avatarId: string | null
}) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Welkom{name ? `, ${name}` : ''}
      </h1>

      {/* §8: small, non-prominent avatar next to the lessons entry point —
          not yet a link, since there is no profile page to open. */}
      <div className="flex items-center gap-2">
        <AvatarIcon avatarId={avatarId} size={32} />

        {/* §7/§8: small, non-prominent entry point to /lessen — a dot, not a
            count, so it never reads as an "unread"-style badge. */}
        <Link
          href="/lessen"
          aria-label="Mijn lessen"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 4.5c1.8-.8 4-.8 6 .5 2-1.3 4.2-1.3 6-.5v10c-1.8-.8-4-.8-6 .5-2-1.3-4.2-1.3-6-.5V4.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M10 5v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {hasLessons ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
          ) : null}
        </Link>
      </div>
    </header>
  )
}
