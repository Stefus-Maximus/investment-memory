import type { SupabaseClient } from '@supabase/supabase-js'

import type { CompanyStatus, Database, MomentType } from '@/lib/supabase/database.types'

// Number of past months shown in the attention heatmap (§12 in CLAUDE.md).
const ACTIVITY_MONTHS = 8

export interface CompanyWithActivity {
  id: string
  name: string
  ticker: string
  exchange: string
  logoUrl: string | null
  latestMoment: {
    type: MomentType
    label: string | null
    occurredAt: string
  } | null
  /** Oldest → newest, one entry per month: true = a moment was recorded that month. */
  activity: boolean[]
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

export async function getCompaniesWithActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: CompanyStatus
): Promise<CompanyWithActivity[]> {
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, ticker, exchange, logo_url')
    .eq('user_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (companiesError) throw companiesError
  if (!companies || companies.length === 0) return []

  const { data: moments, error: momentsError } = await supabase
    .from('moments')
    .select('company_id, type, content, source_title, occurred_at')
    .in(
      'company_id',
      companies.map((company) => company.id)
    )
    .order('occurred_at', { ascending: false })

  if (momentsError) throw momentsError

  const now = new Date()
  const monthKeys = Array.from({ length: ACTIVITY_MONTHS }, (_, i) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() - (ACTIVITY_MONTHS - 1 - i), 1))
  )

  return companies.map((company) => {
    const companyMoments = (moments ?? []).filter((m) => m.company_id === company.id)
    const latest = companyMoments[0] ?? null
    const activeMonths = new Set(companyMoments.map((m) => monthKey(new Date(m.occurred_at))))

    return {
      id: company.id,
      name: company.name,
      ticker: company.ticker,
      exchange: company.exchange,
      logoUrl: company.logo_url,
      latestMoment: latest
        ? {
            type: latest.type,
            label: latest.type === 'source' ? latest.source_title : latest.content,
            occurredAt: latest.occurred_at,
          }
        : null,
      activity: monthKeys.map((key) => activeMonths.has(key)),
    }
  })
}
