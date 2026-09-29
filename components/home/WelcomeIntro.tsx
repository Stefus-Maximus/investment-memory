'use client'

import { useState, useTransition } from 'react'

import { completeOnboarding } from '@/app/actions/auth'

// Shown exactly once, right after the very first real login (pasted spec —
// no CLAUDE.md chapter number for this one). One calm screen that collects a
// display name, then flips the onboarding_seen flag on the auth user (see
// completeOnboarding) and revalidates "/", so the next render of HomePage
// picks it up server-side and this component simply stops rendering — same
// pattern as ThesisSection elsewhere in the app.
export function WelcomeIntro() {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    if (isPending || !name.trim()) return
    startTransition(async () => {
      await completeOnboarding(name)
    })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 bg-white px-6 text-slate-900">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-[22px] font-bold leading-relaxed text-slate-900">
          Hoe wil je genoemd worden?
        </p>
        <p className="text-sm leading-relaxed text-slate-500">
          Zo spreekt Investment Memory je aan. Je kunt dit later altijd aanpassen.
        </p>
      </div>

      <input
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleStart()
        }}
        placeholder="Jouw naam"
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />

      <button
        type="button"
        onClick={handleStart}
        disabled={isPending || !name.trim()}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? 'Bezig…' : 'Beginnen'}
      </button>
    </main>
  )
}
