import type { SupabaseClient } from '@supabase/supabase-js'

import { convictionChangeTitle } from '@/lib/conviction'
import type { Database, MomentType } from '@/lib/supabase/database.types'

export interface MemoryCard {
  momentId: string
  companyId: string
  companyName: string
  companyTicker: string
  companyLogoUrl: string | null
  type: MomentType
  /** e.g. "3 maanden geleden", or the "Recent toegevoegd" fallback label. */
  windowLabel: string
  quote: string | null
  occurredAt: string
}

interface MemoryWindow {
  label: string
  targetDays: number
  toleranceDays: number
}

// §9.3: purely a time-window match on occurred_at — no smart/AI selection.
// One window per throwback ("3 maanden geleden" etc.), each with enough
// tolerance around its target age that a real journal (which isn't written
// on exact anniversaries) still finds a match. Ordered from smallest to
// largest tolerance: this order also decides which window "wins" a moment
// that happens to fall inside more than one window's range (see the
// dedup logic in getMemories below).
const MEMORY_WINDOWS: MemoryWindow[] = [
  { label: '1 week geleden', targetDays: 7, toleranceDays: 3 },
  { label: '1 maand geleden', targetDays: 30, toleranceDays: 5 },
  { label: '3 maanden geleden', targetDays: 90, toleranceDays: 15 },
  { label: '6 maanden geleden', targetDays: 182, toleranceDays: 20 },
  { label: '1 jaar geleden', targetDays: 365, toleranceDays: 30 },
]

const MS_PER_DAY = 1000 * 60 * 60 * 24

type MomentRow = Pick<
  Database['public']['Tables']['moments']['Row'],
  'id' | 'company_id' | 'type' | 'content' | 'source_title' | 'conviction_from' | 'conviction_to' | 'occurred_at'
>

interface CompanyInfo {
  name: string
  ticker: string
  logoUrl: string | null
}

// §9.2: the throwback is about *when*, not what the price was — the preview
// is the user's own words (or, lacking those, the nearest thing to it), never
// a price. The badge (added in the UI) already says what kind of moment this
// is, so the quote doesn't need to repeat that.
function momentQuote(
  moment: Pick<MomentRow, 'type' | 'content' | 'source_title' | 'conviction_from' | 'conviction_to'>
): string | null {
  if (moment.type === 'source') {
    return moment.content?.trim() || moment.source_title
  }

  if (moment.type === 'conviction_change') {
    return moment.content?.trim() || convictionChangeTitle(moment.conviction_from, moment.conviction_to)
  }

  return moment.content?.trim() || null
}

function toMemoryCard(moment: MomentRow, company: CompanyInfo, windowLabel: string): MemoryCard {
  return {
    momentId: moment.id,
    companyId: moment.company_id,
    companyName: company.name,
    companyTicker: company.ticker,
    companyLogoUrl: company.logoUrl,
    type: moment.type,
    windowLabel,
    quote: momentQuote(moment),
    occurredAt: moment.occurred_at,
  }
}

export async function getMemories(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MemoryCard[]> {
  const { data: moments, error: momentsError } = await supabase
    .from('moments')
    .select('id, company_id, type, content, source_title, conviction_from, conviction_to, occurred_at')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })

  if (momentsError) throw momentsError
  if (!moments || moments.length === 0) return []

  const companyIds = Array.from(new Set(moments.map((moment) => moment.company_id)))
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, ticker, logo_url')
    .in('id', companyIds)

  if (companiesError) throw companiesError
  const companyById = new Map(
    (companies ?? []).map((company) => [
      company.id,
      { name: company.name, ticker: company.ticker, logoUrl: company.logo_url } satisfies CompanyInfo,
    ])
  )

  const now = Date.now()
  const withAge = moments.map((moment) => ({
    moment,
    ageDays: (now - new Date(moment.occurred_at).getTime()) / MS_PER_DAY,
  }))

  const cards: MemoryCard[] = []
  // A moment that falls inside more than one window's range (e.g. right on
  // the 1 week/1 maand boundary) may only appear once. MEMORY_WINDOWS is
  // ordered by ascending tolerance, so processing it in order and claiming
  // each matched moment here means the tightest/best-fitting window always
  // wins it, and later, looser windows just skip it.
  const usedMomentIds = new Set<string>()

  for (const window of MEMORY_WINDOWS) {
    const candidates = withAge.filter(
      ({ moment, ageDays }) =>
        !usedMomentIds.has(moment.id) && Math.abs(ageDays - window.targetDays) <= window.toleranceDays
    )
    if (candidates.length === 0) continue

    const closest = candidates.reduce((best, candidate) =>
      Math.abs(candidate.ageDays - window.targetDays) < Math.abs(best.ageDays - window.targetDays)
        ? candidate
        : best
    )

    const company = companyById.get(closest.moment.company_id)
    if (!company) continue

    usedMomentIds.add(closest.moment.id)
    cards.push(toMemoryCard(closest.moment, company, window.label))
  }

  if (cards.length > 0) return cards

  // No moment falls near any of the windows above — fall back to whatever
  // was added most recently, of any type, rather than hiding the section (§9).
  const mostRecent = moments[0]
  const company = companyById.get(mostRecent.company_id)
  if (!company) return []

  return [toMemoryCard(mostRecent, company, 'Recent toegevoegd')]
}
