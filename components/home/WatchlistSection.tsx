import type { CompanyWithActivity } from '@/lib/data/companies'

import { CompanyListItem } from './CompanyListItem'
import { EmptyState } from './EmptyState'

export function WatchlistSection({
  companies,
  onAdd,
}: {
  companies: CompanyWithActivity[]
  onAdd: () => void
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Watchlist</h2>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          + Voeg toe
        </button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          title="Watchlist leeg"
          description="Je watchlist is nog leeg. Bewaar bedrijven waar je later verder over wilt nadenken."
          actionLabel="+ Voeg toe aan watchlist"
          onAction={onAdd}
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {companies.map((company) => (
            <CompanyListItem key={company.id} company={company} />
          ))}
        </div>
      )}
    </section>
  )
}
