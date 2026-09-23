'use client'

import { useState, useTransition } from 'react'

import { deleteCompany } from '@/app/actions/companies'

// The one place a company itself (not a moment) can be removed — mainly so a
// stray test/duplicate entry has a way out without going into Supabase by
// hand. Confirmation is inline, same "..." → sub-panel pattern used for
// deleting a moment.
export function CompanyOptionsMenu({
  companyId,
  companyName,
}: {
  companyId: string
  companyName: string
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function close() {
    setOpen(false)
    setConfirming(false)
    setError(null)
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      // On success this redirects and never returns; a result only comes
      // back here on failure.
      const result = await deleteCompany(companyId)
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Meer opties"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="10" r="1.4" />
          <circle cx="10" cy="10" r="1.4" />
          <circle cx="16" cy="10" r="1.4" />
        </svg>
      </button>

      {open ? (
        <>
          <button type="button" aria-label="Sluiten" onClick={close} className="fixed inset-0 z-40" />

          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
            {confirming ? (
              <div className="p-1.5">
                <p className="text-sm text-slate-700">
                  Weet je zeker dat je <span className="font-medium">{companyName}</span> wilt
                  verwijderen? Alle momenten en je these gaan hiermee ook weg.
                </p>
                {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    {isPending ? 'Bezig…' : 'Verwijderen'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Bedrijf verwijderen
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
