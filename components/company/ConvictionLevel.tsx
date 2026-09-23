'use client'

import { useState } from 'react'

import { convictionLabel, convictionUILevel } from '@/lib/conviction'

import { ConvictionEditSheet } from './ConvictionEditSheet'

const DOT_COUNT = 5

// This is the one canonical conviction badge — reuse it anywhere else
// conviction needs to be shown (e.g. a future homepage list treatment).
export function ConvictionLevel({
  companyId,
  conviction,
}: {
  companyId: string
  conviction: number | null
}) {
  const [editing, setEditing] = useState(false)
  const filled = conviction ?? 0

  return (
    <>
      <div className="flex shrink-0 flex-col items-start gap-1 rounded-xl bg-blue-600 px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-white/50">
          Overtuiging
        </span>
        <span className="text-sm font-bold text-white">{convictionLabel(conviction)}</span>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: DOT_COUNT }, (_, i) => i + 1).map((level) => (
              <span
                key={level}
                className={`h-1.5 w-1.5 rounded-full ${level <= filled ? 'bg-white' : 'bg-white/25'}`}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Overtuiging aanpassen"
            className="text-white/70 hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M14.5 3.5a1.5 1.5 0 0 1 2 2L7 15l-3.5 1L4.5 12.5 14.5 3.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {editing ? (
        <ConvictionEditSheet
          companyId={companyId}
          currentLevel={convictionUILevel(conviction)}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  )
}
