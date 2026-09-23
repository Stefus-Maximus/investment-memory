import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

export interface InvestmentRule {
  id: string
  content: string
  createdAt: string
}

// Oldest first — a "fixed rules" list reads as something that grew over
// time, each new rule added below the last, not a reverse-chronological feed.
export async function getInvestmentRules(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<InvestmentRule[]> {
  const { data, error } = await supabase
    .from('investment_rules')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  }))
}
