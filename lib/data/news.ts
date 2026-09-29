import type { SupabaseClient } from '@supabase/supabase-js'

import { getCompanyNews, type NewsArticle } from '@/lib/news/yahoo-news'
import type { Database } from '@/lib/supabase/database.types'

// §"NIEUWS TOEVOEGEN" spec: max 3 headlines per company block.
const HEADLINES_PER_COMPANY = 3

export interface NewsHeadline extends NewsArticle {
  alreadyAdded: boolean
}

export interface CompanyNewsGroup {
  companyId: string
  name: string
  ticker: string
  headlines: NewsHeadline[]
}

// Portfolio and watchlist, grouped by company (§ spec: "Portfolio én
// Watchlist, gegroepeerd op bedrijf") — a company without news this week is
// left out entirely rather than shown empty.
export async function getWeeklyNews(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyNewsGroup[]> {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, ticker, exchange')
    .eq('user_id', userId)

  if (error || !companies || companies.length === 0) return []

  const { data: existingSources } = await supabase
    .from('moments')
    .select('company_id, source_url')
    .eq('user_id', userId)
    .eq('type', 'source')
    .in(
      'company_id',
      companies.map((company) => company.id)
    )

  const addedUrlsByCompany = new Map<string, Set<string>>()
  for (const row of existingSources ?? []) {
    if (!row.source_url) continue
    const set = addedUrlsByCompany.get(row.company_id) ?? new Set<string>()
    set.add(row.source_url)
    addedUrlsByCompany.set(row.company_id, set)
  }

  const groups = await Promise.all(
    companies.map(async (company): Promise<CompanyNewsGroup | null> => {
      // A failing fetch for one company (see yahoo-news.ts) yields null here
      // and that company is simply skipped — same as "no news this week",
      // and never breaks the rest of the page.
      const articles = await getCompanyNews(company.name, company.ticker, company.exchange)
      if (!articles || articles.length === 0) return null

      const addedUrls = addedUrlsByCompany.get(company.id) ?? new Set<string>()
      const headlines = articles.slice(0, HEADLINES_PER_COMPANY).map((article) => ({
        ...article,
        alreadyAdded: addedUrls.has(article.url),
      }))

      return { companyId: company.id, name: company.name, ticker: company.ticker, headlines }
    })
  )

  return groups.filter((group): group is CompanyNewsGroup => group !== null)
}
