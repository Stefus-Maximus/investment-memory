import type { CompanyWithActivity } from '@/lib/data/companies'

import { CompanyListItem } from './CompanyListItem'
import { EmptyState } from './EmptyState'

export function PortfolioSection({
  companies,
  onAdd,
}: {
  companies: CompanyWithActivity[]
  onAdd: () => void
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Portfolio</h2>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          + Bedrijf toevoegen
        </button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          title="Portfolio leeg"
          description="Nog geen bedrijven. Begin met een bedrijf waar je een overtuiging over hebt."
          actionLabel="+ Bedrijf toevoegen"
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
