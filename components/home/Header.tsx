import Link from 'next/link'

// Two letters at most: "Stef" -> "St", "Stef Beentjes" -> "SB".
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Header({ name }: { name: string | null }) {
  const firstName = name?.trim().split(/\s+/)[0]

  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Welkom{firstName ? `, ${firstName}` : ''}
      </h1>

      {/* §8: small, non-prominent avatar — the one icon in the header, doing
          double duty as both the profile identity and the entry point to
          /lessen (there's no separate profile page to open yet). A coloured
          circle with the user's initials, same visual pattern as the
          company-logo initials fallback but in the lessons journal's own
          dark green accent (never the app's main blue), so it reads as
          personal rather than as another interactive/conviction element. */}
      <Link
        href="/lessen"
        aria-label="Profiel en mijn lessen"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-medium text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        {name ? getInitials(name) : null}
      </Link>
    </header>
  )
}
