'use client'

import { useTransition } from 'react'

import { completeOnboarding } from '@/app/actions/auth'

// Shown exactly once, right after the very first real login (§ pasted spec —
// no CLAUDE.md chapter number for this one). One calm screen, no steps, no
// carousel. Dismissing it flips the onboarding_seen flag on the auth user
// (see completeOnboarding) and revalidates "/", so the next render of
// HomePage picks it up server-side and this component simply stops rendering
// — same pattern as ThesisSection elsewhere in the app.
export function WelcomeIntro() {
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    startTransition(async () => {
      await completeOnboarding()
    })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-10 bg-white px-6 text-center text-slate-900">
      <div className="flex flex-col gap-5">
        <p className="font-serif text-[22px] leading-relaxed text-slate-900">
          Sla je gedachtes en informatie georganiseerd op. Zie later terug wat je dacht, herken
          je patronen, en maak betere keuzes.
        </p>
        <p className="text-sm leading-relaxed text-slate-500">
          Investment Memory is geen trading-app en geen portfolio tracker. Het is een rustige
          plek om je beleggingsredenering vast te leggen — zodat je later precies kunt terugzien
          wat je toen dacht.
        </p>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? 'Bezig…' : 'Beginnen'}
      </button>
    </main>
  )
}
