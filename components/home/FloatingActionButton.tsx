'use client'

import { useState } from 'react'

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Sluiten"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/20"
        />
      )}

      {open && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <p className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Nieuwe toevoeging
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Notitie
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Bron
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Nieuwe toevoeging"
        aria-expanded={open}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-transform hover:bg-blue-700 active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </>
  )
}
