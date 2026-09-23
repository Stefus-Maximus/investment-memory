import type { ReactElement } from 'react'

import type { MomentType } from '@/lib/supabase/database.types'

// §28/§43: none of these may read as up/down — no trend arrows, no
// direction of any kind, even a static one. A pen, a link and a slider
// handle are all neutral: they say what kind of moment this is, never
// whether it turned out well.
function NoteIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M8.4 1.6l2 2L4 9l-2.5.5L2 7 8.4 1.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SourceIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5l3-3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M5.3 3.6l.4-.4a2 2 0 0 1 2.8 2.8l-.7.7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6.7 8.4l-.4.4a2 2 0 0 1-2.8-2.8l.7-.7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// A slider handle, not an arrow — it says "this got adjusted", not
// "this went up".
function ConvictionIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6.5" cy="6" r="1.6" fill="currentColor" />
    </svg>
  )
}

const BADGE_CONFIG: Record<MomentType, { label: string; icon: () => ReactElement }> = {
  note: { label: 'Notitie', icon: NoteIcon },
  source: { label: 'Bron', icon: SourceIcon },
  conviction_change: { label: 'Overtuiging', icon: ConvictionIcon },
}

// One badge for all three moment types, shared between the company page's
// timeline and the homepage's memories rail (§ styling request: same
// muted-blue pill and icon set everywhere, only label differs) — never
// near-identical implementations per page that quietly drift apart.
export function MomentTypeBadge({ type, selected = false }: { type: MomentType; selected?: boolean }) {
  const { label, icon: Icon } = BADGE_CONFIG[type]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-200 ${
        selected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
      }`}
    >
      <Icon />
      {label}
    </span>
  )
}
