'use client'

import { useState, useTransition } from 'react'

import { signOut } from '@/app/actions/auth'

// The linking form (magic-link email field) now lives in AuthGate, which
// blocks every page until a real account is linked — by the time a session
// reaches "Mijn lessen" it always has one, so this block only ever shows the
// logged-in state.
export function ProfileBlock({ email }: { email: string | null }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    setError(null)
    startTransition(async () => {
      const result = await signOut()
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-5">
      <p className="text-xs text-slate-400">
        Ingelogd als <span className="text-slate-500">{email}</span>
      </p>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="self-start text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline disabled:opacity-60"
      >
        {isPending ? 'Bezig…' : 'Uitloggen'}
      </button>
    </div>
  )
}
