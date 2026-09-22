import Link from 'next/link'

import { CompanyLogo } from '@/components/CompanyLogo'
import type { CompanyWithActivity } from '@/lib/data/companies'
import { formatShortDate } from '@/lib/format'

import { AttentionHeatmap } from './AttentionHeatmap'

export function CompanyListItem({ company }: { company: CompanyWithActivity }) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50"
    >
      <CompanyLogo logoUrl={company.logoUrl} ticker={company.ticker} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-balance text-slate-900">
          {company.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{company.ticker}</p>
        {company.latestMoment ? (
          <p className="mt-1 truncate text-sm text-slate-500">
            Laatste toevoeging · {formatShortDate(company.latestMoment.occurredAt)}
            {company.latestMoment.label ? (
              <span className="italic"> — &ldquo;{company.latestMoment.label}&rdquo;</span>
            ) : null}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Nog geen moment vastgelegd.</p>
        )}
      </div>

      <AttentionHeatmap activity={company.activity} />
    </Link>
  )
}
