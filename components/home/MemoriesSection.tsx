import Link from 'next/link'

import { CompanyLogo } from '@/components/CompanyLogo'
import { MomentTypeBadge } from '@/components/MomentTypeBadge'
import type { MemoryCard } from '@/lib/data/memories'

// §9: throwbacks are a reminder, not a notification — a quiet horizontal
// rail the user browses at their own pace, never a badge or an alert.
export function MemoriesSection({ memories }: { memories: MemoryCard[] }) {
  if (memories.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900">Terug in je beleggingsreis</h2>
      <p className="mt-0.5 text-sm text-slate-500">Momenten uit het verleden die relevant blijven.</p>

      {/* §9.1: a sliver of the next card stays visible so horizontal scroll
          reads as scrollable, not as a single full-width card. */}
      <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {memories.map((memory) => (
          <Link
            key={memory.momentId}
            href={`/companies/${memory.companyId}`}
            className="flex w-[82%] shrink-0 snap-start flex-col gap-2 rounded-xl border border-slate-100 bg-white py-3 pr-3 pl-2 shadow-sm transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <CompanyLogo logoUrl={memory.companyLogoUrl} ticker={memory.companyTicker} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{memory.companyName}</p>
                <span className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
                  {memory.windowLabel}
                </span>
              </div>
            </div>

            <div className="self-start">
              <MomentTypeBadge type={memory.type} />
            </div>

            {memory.quote ? (
              <p className="line-clamp-2 text-sm text-balance text-slate-600 italic">
                &ldquo;{memory.quote}&rdquo;
              </p>
            ) : null}

            <span className="mt-auto pt-1 text-sm font-medium text-blue-600">Bekijk moment →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
