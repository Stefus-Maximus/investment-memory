'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { search } from '@/app/actions/search'
import type { SearchResult } from '@/lib/data/search'

import { SearchResultsList } from './SearchResultsList'

const DEBOUNCE_MS = 300

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [isPending, startTransition] = useTransition()
  // Guards against an earlier, slower request overwriting a later one's
  // results once both debounced calls land out of order.
  const requestId = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    // Nothing to fetch — any stale results were already cleared by the input's
    // own change handler below.
    if (!trimmed) return

    const id = ++requestId.current
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await search(trimmed)
        if (id === requestId.current) setResults(found)
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [query])

  const trimmedQuery = query.trim()

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        autoFocus
        value={query}
        onChange={(event) => {
          // Clear stale results here, synchronously with the keystroke, so a
          // query change never briefly shows the previous query's results
          // while the new one's debounce is still pending.
          setQuery(event.target.value)
          setResults(null)
        }}
        placeholder="Zoek in wat je zelf hebt geschreven…"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
      />

      {trimmedQuery === '' ? (
        <p className="mt-8 text-center text-sm text-slate-400">
          Zoek in je theses, notities, bronnen, lessen en beleggingsregels.
        </p>
      ) : results === null || isPending ? (
        <p className="mt-8 text-center text-sm text-slate-400">Zoeken…</p>
      ) : results.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-400">Niets gevonden voor &ldquo;{trimmedQuery}&rdquo;.</p>
      ) : (
        <SearchResultsList results={results} query={trimmedQuery} />
      )}
    </div>
  )
}
