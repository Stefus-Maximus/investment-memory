'use server'

import { searchJournal, type SearchResult } from '@/lib/data/search'
import { createClient } from '@/lib/supabase/server'

export async function search(query: string): Promise<SearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.is_anonymous) return []

  return searchJournal(supabase, user.id, query)
}
