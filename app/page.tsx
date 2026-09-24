import { getCompaniesWithActivity } from '@/lib/data/companies'
import { getLessonsCount } from '@/lib/data/lessons'
import { getMemories } from '@/lib/data/memories'
import { createClient } from '@/lib/supabase/server'
import { AuthGate } from '@/components/auth/AuthGate'
import { Header } from '@/components/home/Header'
import { HomeContent } from '@/components/home/HomeContent'
import { MemoriesSection } from '@/components/home/MemoriesSection'
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
  // display_name/avatar_id) and revalidates "/".
  if (!user?.user_metadata?.onboarding_seen) {
    return <WelcomeIntro />
  }

  const firstName = (user?.user_metadata?.display_name as string | undefined)
    ?.trim()
    .split(' ')[0]
  const avatarId = (user?.user_metadata?.avatar_id as string | undefined) ?? null

  const [portfolio, watchlist, memories, lessonsCount] = user
    ? await Promise.all([
        getCompaniesWithActivity(supabase, user.id, 'portfolio'),
        getCompaniesWithActivity(supabase, user.id, 'watchlist'),
        getMemories(supabase, user.id),
        getLessonsCount(supabase, user.id),
      ])
    : [[], [], [], 0]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 bg-white px-4 pb-28 pt-6 text-slate-900">
      <Header name={firstName ?? null} hasLessons={lessonsCount > 0} avatarId={avatarId} />
      <MemoriesSection memories={memories} />
      <HomeContent portfolio={portfolio} watchlist={watchlist} />
    </main>
  )
}
