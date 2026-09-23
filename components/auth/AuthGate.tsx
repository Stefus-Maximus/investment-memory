'use client'

import { useState, useTransition } from 'react'

import { requestMagicLink } from '@/app/actions/auth'

// Full-screen, blocking — rendered by every top-level page (homepage,
// company page, lessen) whenever the current session is still anonymous
// (see lib/supabase/proxy.ts: every visitor gets one on first request).
// Reuses requestMagicLink unchanged: converting the anonymous session to a
// real account keeps the same auth.uid(), so nothing written under it
// before this point is lost once the link is confirmed.
export function AuthGate() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!email.trim() || isPending) return
    setError(null)
    startTransition(async () => {
      const result = await requestMagicLink(email)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSent(true)
    })
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-blue-600 px-6 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <p className="text-xl font-semibold leading-relaxed text-white">
          Sla je gedachtes en informatie georganiseerd op. Zie later terug wat je dacht, herken je
          patronen, en word een betere belegger.
        </p>

        {sent ? (
          <p className="text-sm text-white/80">
            Check je inbox — we hebben een inloglink gestuurd naar{' '}
            <span className="text-white">{email}</span>.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              placeholder="jij@voorbeeld.nl"
              className="w-full rounded-lg border border-white/25 bg-white/10 px-4 py-3 text-center text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isPending || !email.trim()}
              className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-white/90 disabled:opacity-60"
            >
              {isPending ? 'Versturen…' : 'Stuur inloglink'}
            </button>

            {error ? <p className="text-xs text-white/90">{error}</p> : null}
          </div>
        )}
      </div>
    </main>
  )
}
