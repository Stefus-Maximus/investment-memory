'use client'

import { useState, useTransition } from 'react'

import { createCompany } from '@/app/actions/companies'
import { searchKnownCompanies, type KnownCompany } from '@/lib/data/known-companies'
import type { CompanyStatus } from '@/lib/supabase/database.types'

const STATUS_OPTIONS: { value: CompanyStatus; label: string }[] = [
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'watchlist', label: 'Watchlist' },
]

// Mount this with a `key` derived from `defaultStatus` so opening it fresh
// (from either section) always starts a new instance with clean state,
// instead of syncing props into state via an effect.
export function AddCompanySheet({
  defaultStatus,
  onClose,
}: {
  defaultStatus: CompanyStatus
  onClose: () => void
}) {
  const [step, setStep] = useState<'search' | 'details'>('search')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<KnownCompany | null>(null)
  const [status, setStatus] = useState<CompanyStatus>(defaultStatus)
  const [thesisText, setThesisText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const results = searchKnownCompanies(query)

  function handleSelect(company: KnownCompany) {
    setSelected(company)
    setStep('details')
    setError(null)
  }

  function handleSave() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await createCompany({
        name: selected.name,
        ticker: selected.ticker,
        exchange: selected.exchange,
        status,
        thesisText,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <>
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/30"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          {step === 'details' ? (
            <button
              type="button"
              onClick={() => setStep('search')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ‹ Terug
            </button>
          ) : (
            <span className="text-sm font-semibold text-slate-900">Bedrijf toevoegen</span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {step === 'search' ? (
            <div>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek op naam of ticker..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />

              <div className="mt-3 divide-y divide-slate-100">
                {results.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Geen resultaten. Deze lijst is nog beperkt — meer bedrijven volgen later.
                  </p>
                ) : (
                  results.map((company) => (
                    <button
                      key={`${company.ticker}-${company.exchange}`}
                      type="button"
                      onClick={() => handleSelect(company)}
                      className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-900">{company.name}</span>
                      <span className="shrink-0 text-sm text-slate-400">
                        {company.ticker} · {company.exchange}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : selected ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-400">
                  {selected.ticker} · {selected.exchange}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Lijst
                </p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        status === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="thesis"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400"
                >
                  Waarom wil je dit bedrijf volgen? (optioneel)
                </label>
                <textarea
                  id="thesis"
                  rows={3}
                  value={thesisText}
                  onChange={(e) => setThesisText(e.target.value)}
                  placeholder="Schrijf op wat er door je hoofd gaat..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
