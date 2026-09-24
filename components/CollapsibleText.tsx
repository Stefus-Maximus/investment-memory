'use client'

import { useEffect, useRef, useState } from 'react'

function ChevronIcon({ direction }: { direction: 'down' | 'up' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={direction === 'up' ? 'rotate-180' : undefined}
    >
      <path d="M4.5 7.5 10 13l5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Same collapse pattern as RulesCard (§1: fixed preview, toggle to reveal)
// applied to a single block of free text. A clean line-clamp cutoff with a
// trailing "…" — never a fade to muted/transparent — so the visible text
// stays at its full, intended color right up to where it's cut. The toggle
// only renders once the text actually overflows the clamp — a short note or
// thesis answer never gets a pointless "Toon volledig".
export function CollapsibleText({
  text,
  className = '',
  toggleClassName,
}: {
  text: string
  className?: string
  toggleClassName: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div className="mt-1">
      <p ref={textRef} className={`${className} ${!expanded ? 'line-clamp-3' : ''}`}>
        {text}
      </p>

      {overflowing ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${toggleClassName}`}
        >
          {expanded ? 'Toon minder' : 'Toon volledig'}
          <ChevronIcon direction={expanded ? 'up' : 'down'} />
        </button>
      ) : null}
    </div>
  )
}
