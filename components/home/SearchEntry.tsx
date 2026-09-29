import Link from 'next/link'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// §8: Header.tsx is deliberately kept to its one icon (the avatar), so this
// lives in the homepage's own content instead of a second header icon — a
// single, quiet row shaped like a search field but not a live one itself; it
// opens the full /zoeken screen.
export function SearchEntry() {
  return (
    <Link
      href="/zoeken"
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-100"
    >
      <SearchIcon />
      Zoek in je eigen woorden…
    </Link>
  )
}
