import Link from 'next/link'

import { AuthGate } from '@/components/auth/AuthGate'
import { NewsList } from '@/components/news/NewsList'
import { getWeeklyNews } from '@/lib/data/news'
import { formatWeekRange } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

export default async function NewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No real account linked yet: block the rest of the app until one is —
  // same guard as the homepage and company page.
  if (!user || user.is_anonymous) return <AuthGate />

  const groups = await getWeeklyNews(supabase, user.id)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 bg-white px-4 pb-16 pt-6 text-slate-900">
      <header className="flex items-start gap-3">
        <Link
          href="/"
          aria-label="Terug"
          className="-ml-1.5 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
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

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deze week</h1>
          <p className="mt-0.5 text-sm text-slate-400">{formatWeekRange()}</p>
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Geen nieuws deze week over je bedrijven.
        </p>
      ) : (
        <NewsList groups={groups} />
      )}
    </main>
  )
}
