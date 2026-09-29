'use client'

import { useState } from 'react'

import { AddMomentSheet } from '@/components/company/AddMomentSheet'
import type { CompanyNewsGroup } from '@/lib/data/news'
import { formatShortDate } from '@/lib/format'

interface SheetTarget {
  companyId: string
  url: string
  title: string
}

export function NewsList({ groups }: { groups: CompanyNewsGroup[] }) {
  // Seeded from the server-checked "already added" state, then extended
  // locally on save so a just-added headline flips to "Toegevoegd" without a
  // full page reload (§"ÉÉN-KLIK TOEVOEGEN": "zodat hij niet dubbel wordt
  // toegevoegd").
  const [addedUrls, setAddedUrls] = useState<Set<string>>(
    () =>
      new Set(
        groups.flatMap((group) =>
          group.headlines.filter((headline) => headline.alreadyAdded).map((headline) => headline.url)
        )
      )
  )
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.companyId}>
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-semibold text-slate-900">{group.name}</p>
          </div>

          <div className="mt-2 flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-100">
            {group.headlines.map((headline) => {
              const added = addedUrls.has(headline.url)
              return (
                <div key={headline.url} className="flex items-start justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <a
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium leading-snug text-balance text-slate-900 hover:underline"
                    >
                      {headline.title}
                    </a>
                    <p className="mt-1 text-xs text-slate-400">
                      {headline.publisher} · {formatShortDate(headline.publishedAt)}
                    </p>
                  </div>

                  {added ? (
                    <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-400">
                      Toegevoegd
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setSheetTarget({
                          companyId: group.companyId,
                          url: headline.url,
                          title: headline.title,
                        })
                      }
                      className="shrink-0 pt-0.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Toevoegen
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {sheetTarget ? (
        <AddMomentSheet
          companyId={sheetTarget.companyId}
          initialStep="source"
          initialSourceUrl={sheetTarget.url}
          initialSourceTitle={sheetTarget.title}
          onSaved={() => {
            const url = sheetTarget.url
            setAddedUrls((prev) => new Set(prev).add(url))
          }}
          onClose={() => setSheetTarget(null)}
        />
      ) : null}
    </div>
  )
}
