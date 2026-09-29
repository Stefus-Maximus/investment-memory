import Link from 'next/link'

import type { SearchResult, SearchResultType } from '@/lib/data/search'
import { formatShortDate } from '@/lib/format'
import { buildSnippet } from '@/lib/search-snippet'

// Fixed group order per the spec, not relevance-sorted — the same five
// source types the app already asks the user to write in.
const GROUPS: { type: SearchResultType; label: string }[] = [
  { type: 'thesis', label: 'These' },
  { type: 'note', label: 'Notitie' },
  { type: 'source', label: 'Bron' },
  { type: 'lesson', label: 'Les' },
  { type: 'rule', label: 'Beleggingsregel' },
]

export function SearchResultsList({ results, query }: { results: SearchResult[]; query: string }) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map(({ type, label }) => {
        const group = results.filter((result) => result.type === type)
        if (group.length === 0) return null

        return (
          <section key={type}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <div className="mt-2 flex flex-col divide-y divide-slate-100">
              {group.map((result) => (
                <SearchResultRow key={`${type}-${result.id}`} result={result} query={query} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function SearchResultRow({ result, query }: { result: SearchResult; query: string }) {
  const snippet = buildSnippet(result.text, query)

  return (
    <Link href={result.href} className="flex flex-col gap-1 py-3 hover:bg-slate-50">
      <div className="flex items-center justify-between gap-2">
        {result.companyName ? (
          <span className="truncate text-sm font-medium text-slate-900">
            {result.companyName}
            {result.companyTicker ? <span className="text-slate-400"> · {result.companyTicker}</span> : null}
          </span>
        ) : (
          <span />
        )}
        <span className="shrink-0 text-xs text-slate-400">{formatShortDate(result.date)}</span>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
        {snippet.before}
        {snippet.match ? (
          <mark className="rounded bg-blue-600/15 text-blue-700">{snippet.match}</mark>
        ) : null}
        {snippet.after}
      </p>
    </Link>
  )
}
