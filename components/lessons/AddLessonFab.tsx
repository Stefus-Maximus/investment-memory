'use client'

import { useState } from 'react'

import { AddLessonSheet } from './AddLessonSheet'

// Goes straight to the text-field form — there's only one kind of entry
// here, so no intermediate choice menu like the homepage/company FABs have.
export function AddLessonFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nieuwe les"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white shadow-md transition-transform hover:bg-green-800 active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open ? <AddLessonSheet onClose={() => setOpen(false)} /> : null}
    </>
  )
}
