import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AuthGate } from '@/components/auth/AuthGate'
import { AddLessonFab } from '@/components/lessons/AddLessonFab'
import { LessonsTimeline } from '@/components/lessons/LessonsTimeline'
import { ProfileBlock } from '@/components/lessons/ProfileBlock'
import { RulesCard } from '@/components/lessons/RulesCard'
import { getInvestmentRules } from '@/lib/data/investment-rules'
import { getLessons } from '@/lib/data/lessons'
import { createClient } from '@/lib/supabase/server'

export default async function LessonsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  // No real account linked yet: block the rest of the app until one is.
  if (user.is_anonymous) return <AuthGate />

  const [lessons, rules] = await Promise.all([
    getLessons(supabase, user.id),
    getInvestmentRules(supabase, user.id),
  ])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white px-4 pb-28 pt-6 text-slate-900">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Terug"
          className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 4 7 10l5.5 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Mijn lessen</h1>
      </header>

      <div className="mt-5">
        <RulesCard rules={rules} />
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-900">Mijn lessen</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {lessons.length > 0
            ? `${lessons.length} ${lessons.length === 1 ? 'les' : 'lessen'} vastgelegd`
            : 'Nog geen lessen vastgelegd'}
        </p>

        <LessonsTimeline lessons={lessons} />
      </div>

      <ProfileBlock email={user.email ?? null} />

      <AddLessonFab />
    </main>
  )
}
