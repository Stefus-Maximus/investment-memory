import Link from 'next/link'

import { getCompaniesWithActivity } from '@/lib/data/companies'
import { getMemories } from '@/lib/data/memories'
import { createClient } from '@/lib/supabase/server'
import { AuthGate } from '@/components/auth/AuthGate'
import { Header } from '@/components/home/Header'
import { HomeContent } from '@/components/home/HomeContent'
import { MemoriesSection } from '@/components/home/MemoriesSection'
import { SearchEntry } from '@/components/home/SearchEntry'
import { WelcomeIntro } from '@/components/home/WelcomeIntro'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No real account linked yet: block the rest of the app until one is.
  if (user?.is_anonymous ?? true) {
    return <AuthGate />
  }

  // First real login ever: show the one-time welcome screen instead of the
  // homepage. completeOnboarding() flips this flag (and saves the chosen
  // display_name) and revalidates "/".
  if (!user?.user_metadata?.onboarding_seen) {
    return <WelcomeIntro />
  }

  const displayName = (user?.user_metadata?.display_name as string | undefined)?.trim() ?? null

  const [portfolio, watchlist, memories] = user
    ? await Promise.all([
        getCompaniesWithActivity(supabase, user.id, 'portfolio'),
        getCompaniesWithActivity(supabase, user.id, 'watchlist'),
        getMemories(supabase, user.id),
      ])
    : [[], [], []]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 bg-white px-4 pb-28 pt-6 text-slate-900">
      <Header name={displayName} />
      <SearchEntry />
      <MemoriesSection memories={memories} />
      <HomeContent portfolio={portfolio} watchlist={watchlist} />

      {/* §"DE PAGINA" nieuws-spec: a quiet text link, no badge, no counter,
          no accent color beyond the app's normal link blue. */}
      <Link href="/nieuws" className="text-center text-sm text-slate-400 hover:text-slate-600">
        Bekijk deze week
      </Link>
    </main>
  )
}
