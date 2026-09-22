'use client'

import { useState } from 'react'

import type { CompanyWithActivity } from '@/lib/data/companies'
import type { CompanyStatus } from '@/lib/supabase/database.types'

import { AddCompanySheet } from './AddCompanySheet'
import { PortfolioSection } from './PortfolioSection'
import { WatchlistSection } from './WatchlistSection'

export function HomeContent({
  portfolio,
  watchlist,
}: {
  portfolio: CompanyWithActivity[]
  watchlist: CompanyWithActivity[]
}) {
  const [addStatus, setAddStatus] = useState<CompanyStatus | null>(null)

  return (
    <>
      <PortfolioSection companies={portfolio} onAdd={() => setAddStatus('portfolio')} />
      <WatchlistSection companies={watchlist} onAdd={() => setAddStatus('watchlist')} />

      {addStatus ? (
        <AddCompanySheet
          key={addStatus}
          defaultStatus={addStatus}
          onClose={() => setAddStatus(null)}
        />
      ) : null}
    </>
  )
}
