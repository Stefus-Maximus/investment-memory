import Link from 'next/link'

import type { CompanyWithActivity } from '@/lib/data/companies'
import { formatShortDate } from '@/lib/format'

import { AttentionHeatmap } from './AttentionHeatmap'

export function CompanyListItem({ company }: { company: CompanyWithActivity }) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-balance text-slate-900">
          {company.name}
        </p>
        {company.latestMoment ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {formatShortDate(company.latestMoment.occurredAt)}
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
