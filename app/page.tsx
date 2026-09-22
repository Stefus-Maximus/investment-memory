import { getCompaniesWithActivity } from '@/lib/data/companies'
import { getMemories } from '@/lib/data/memories'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/home/Header'
import { HomeContent } from '@/components/home/HomeContent'
import { MemoriesSection } from '@/components/home/MemoriesSection'
import { FloatingActionButton } from '@/components/home/FloatingActionButton'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName = (user?.user_metadata?.full_name as string | undefined)
    ?.trim()
    .split(' ')[0]

  const [portfolio, watchlist, memories] = user
    ? await Promise.all([
        getCompaniesWithActivity(supabase, user.id, 'portfolio'),
        getCompaniesWithActivity(supabase, user.id, 'watchlist'),
        getMemories(supabase, user.id),
      ])
    : [[], [], []]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 bg-white px-4 pb-28 pt-6 text-slate-900">
      <Header name={firstName ?? null} />
      <MemoriesSection memories={memories} />
      <HomeContent portfolio={portfolio} watchlist={watchlist} />
      <FloatingActionButton />
    </main>
  )
}
