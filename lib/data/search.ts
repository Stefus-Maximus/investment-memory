import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

export type SearchResultType = 'thesis' | 'note' | 'source' | 'lesson' | 'rule'

export interface SearchResult {
  id: string
  type: SearchResultType
  companyId: string | null
  companyName: string | null
  companyTicker: string | null
  /** The full matched field, so the UI can build its own excerpt around the term. */
  text: string
  date: string
  href: string
}

// Escapes ILIKE's own wildcard/escape characters so the user's search text is
// matched literally ("bevat de zoekterm") rather than as a pattern they never
// typed as one.
function escapeForIlike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

interface CompanyInfo {
  name: string
  ticker: string
}

// Cross-entity search over the user's own written text: thesis (both
// fields), notes, sources (title + own annotation), lessons and investment
// rules. Plain ILIKE per table (§ zoekfunctie spec) — no separate search
// index, this is personal-journal volume.
export async function searchJournal(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string
): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const pattern = `%${escapeForIlike(trimmed)}%`

  const [thesisByThesisText, thesisByInvalidationText, momentsByContent, momentsBySourceTitle, lessons, rules] =
    await Promise.all([
      supabase
        .from('thesis')
        .select('id, company_id, thesis_text, invalidation_text, updated_at')
        .eq('user_id', userId)
        .ilike('thesis_text', pattern),
      supabase
        .from('thesis')
        .select('id, company_id, thesis_text, invalidation_text, updated_at')
        .eq('user_id', userId)
        .ilike('invalidation_text', pattern),
      supabase
        .from('moments')
        .select('id, company_id, type, content, source_title, occurred_at')
        .eq('user_id', userId)
        .in('type', ['note', 'source'])
        .ilike('content', pattern),
      supabase
        .from('moments')
        .select('id, company_id, type, content, source_title, occurred_at')
        .eq('user_id', userId)
        .eq('type', 'source')
        .ilike('source_title', pattern),
      supabase.from('lessons').select('id, content, created_at').eq('user_id', userId).ilike('content', pattern),
      supabase
        .from('investment_rules')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .ilike('content', pattern),
    ])

  for (const result of [
    thesisByThesisText,
    thesisByInvalidationText,
    momentsByContent,
    momentsBySourceTitle,
    lessons,
    rules,
  ]) {
    if (result.error) throw result.error
  }

  // A company whose thesis matches both fields, or a source whose title and
  // own annotation both match, would otherwise show twice — dedupe by row id,
  // keeping whichever field actually matched for the snippet.
  const thesisMatches = new Map<string, { companyId: string; text: string; date: string }>()
  for (const row of thesisByThesisText.data ?? []) {
    if (row.thesis_text) {
      thesisMatches.set(row.id, { companyId: row.company_id, text: row.thesis_text, date: row.updated_at })
    }
  }
  for (const row of thesisByInvalidationText.data ?? []) {
    if (!thesisMatches.has(row.id) && row.invalidation_text) {
      thesisMatches.set(row.id, { companyId: row.company_id, text: row.invalidation_text, date: row.updated_at })
    }
  }

  const momentMatches = new Map<
    string,
    { companyId: string; type: 'note' | 'source'; text: string; date: string }
  >()
  for (const row of momentsByContent.data ?? []) {
    if (row.content) {
      momentMatches.set(row.id, {
        companyId: row.company_id,
        type: row.type as 'note' | 'source',
        text: row.content,
        date: row.occurred_at,
      })
    }
  }
  for (const row of momentsBySourceTitle.data ?? []) {
    if (!momentMatches.has(row.id) && row.source_title) {
      momentMatches.set(row.id, {
        companyId: row.company_id,
        type: 'source',
        text: row.source_title,
        date: row.occurred_at,
      })
    }
  }

  const companyIds = new Set<string>()
  for (const match of thesisMatches.values()) companyIds.add(match.companyId)
  for (const match of momentMatches.values()) companyIds.add(match.companyId)

  const companyById = new Map<string, CompanyInfo>()
  if (companyIds.size > 0) {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, ticker')
      .in('id', Array.from(companyIds))
    if (error) throw error
    for (const company of companies ?? []) {
      companyById.set(company.id, { name: company.name, ticker: company.ticker })
    }
  }

  const results: SearchResult[] = []

  for (const [id, match] of thesisMatches) {
    const company = companyById.get(match.companyId)
    results.push({
      id,
      type: 'thesis',
      companyId: match.companyId,
      companyName: company?.name ?? null,
      companyTicker: company?.ticker ?? null,
      text: match.text,
      date: match.date,
      // Thesis has no history/moment id of its own (§24) — the company page
      // itself, no ?moment= param, is "the right place".
      href: `/companies/${match.companyId}`,
    })
  }

  for (const [id, match] of momentMatches) {
    const company = companyById.get(match.companyId)
    results.push({
      id,
      type: match.type,
      companyId: match.companyId,
      companyName: company?.name ?? null,
      companyTicker: company?.ticker ?? null,
      text: match.text,
      date: match.date,
      href: `/companies/${match.companyId}?moment=${id}`,
    })
  }

  for (const row of lessons.data ?? []) {
    results.push({
      id: row.id,
      type: 'lesson',
      companyId: null,
      companyName: null,
      companyTicker: null,
      text: row.content,
      date: row.created_at,
      href: `/lessen?lesson=${row.id}`,
    })
  }

  for (const row of rules.data ?? []) {
    results.push({
      id: row.id,
      type: 'rule',
      companyId: null,
      companyName: null,
      companyTicker: null,
      text: row.content,
      date: row.created_at,
      // Rules have no per-item view of their own — they sit at the top of
      // /lessen already, so landing on that page is "the right place".
      href: '/lessen',
    })
  }

  return results
}
