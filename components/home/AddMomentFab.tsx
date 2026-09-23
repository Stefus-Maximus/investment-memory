'use client'

import { useState } from 'react'

import { CompanyLogo } from '@/components/CompanyLogo'
import { AddMomentSheet } from '@/components/company/AddMomentSheet'
import type { CompanyWithActivity } from '@/lib/data/companies'

type Step = 'closed' | 'empty' | 'pick-company' | 'add-moment'

export function AddMomentFab({
  portfolio,
  watchlist,
  onAddCompany,
}: {
  portfolio: CompanyWithActivity[]
  watchlist: CompanyWithActivity[]
  onAddCompany: () => void
}) {
  const [step, setStep] = useState<Step>('closed')
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithActivity | null>(null)

  const hasCompanies = portfolio.length > 0 || watchlist.length > 0

  function handleClose() {
    setStep('closed')
    setSelectedCompany(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep(hasCompanies ? 'pick-company' : 'empty')}
        aria-label="Nieuwe toevoeging"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-transform hover:bg-blue-700 active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {step === 'empty' ? (
        <>
          <button
            type="button"
            aria-label="Sluiten"
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-slate-900/30"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Nieuwe toevoeging</span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Sluiten"
                className="text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <p className="text-sm text-slate-600">
                Je volgt nog geen bedrijven. Voeg eerst een bedrijf toe waar je een gedachte
                over wilt vastleggen.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleClose()
                  onAddCompany()
                }}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                + Bedrijf toevoegen
              </button>
            </div>
          </div>
        </>
      ) : null}

      {step === 'pick-company' ? (
        <>
          <button
            type="button"
            aria-label="Sluiten"
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-slate-900/30"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Voor welk bedrijf?</span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Sluiten"
                className="text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {portfolio.length > 0 ? (
                <CompanyPickerGroup
                  label="Portfolio"
                  companies={portfolio}
                  onSelect={(company) => {
                    setSelectedCompany(company)
                    setStep('add-moment')
                  }}
                />
              ) : null}
              {watchlist.length > 0 ? (
                <CompanyPickerGroup
                  label="Watchlist"
                  companies={watchlist}
                  onSelect={(company) => {
                    setSelectedCompany(company)
                    setStep('add-moment')
                  }}
                />
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {step === 'add-moment' && selectedCompany ? (
        <AddMomentSheet companyId={selectedCompany.id} onClose={handleClose} />
      ) : null}
    </>
  )
}

function CompanyPickerGroup({
  label,
  companies,
  onSelect,
}: {
  label: string
  companies: CompanyWithActivity[]
  onSelect: (company: CompanyWithActivity) => void
}) {
  return (
    <div className="pt-3">
      <p className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="divide-y divide-slate-100">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => onSelect(company)}
            className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-slate-50"
          >
            <CompanyLogo logoUrl={company.logoUrl} ticker={company.ticker} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900">
                {company.name}
              </span>
              <span className="block text-xs text-slate-400">
                {company.ticker} · {company.exchange}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
