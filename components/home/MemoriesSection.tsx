import Link from 'next/link'

import { CompanyLogo } from '@/components/CompanyLogo'
import type { MemoryCard } from '@/lib/data/memories'

// Same neutral affordance language as elsewhere ("this navigates"), not a
// judgement icon — points at the company timeline, nothing more.
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

// §9: throwbacks are a reminder, not a notification — a quiet horizontal
// rail the user browses at their own pace, never a badge or an alert.
//
// Same "selected card" treatment as the timeline in Mijn momenten: solid
// blue background, white bold primary text, white-at-50%-opacity
// supporting text — one visual language for "this is a highlighted
// moment" across the app, not a section-specific variant.
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
          // The full card navigates — the eye glyph bottom-right is purely a
          // visual affordance hint, not a separate, narrower click target.
          <Link
            key={memory.momentId}
            href={`/companies/${memory.companyId}?moment=${memory.momentId}`}
            className="relative flex w-[82%] shrink-0 snap-start flex-col gap-2 rounded-xl bg-blue-600 p-3 shadow-sm transition-colors hover:bg-blue-700"
          >
            <div className="flex items-center gap-2.5 pr-8">
              <div className="shrink-0 rounded-full ring-2 ring-white/70">
                <CompanyLogo logoUrl={memory.companyLogoUrl} ticker={memory.companyTicker} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{memory.companyName}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/50">
                  {memory.windowLabel}
                </span>
              </div>
            </div>

            {memory.quote ? (
              <p className="line-clamp-2 pr-8 text-sm text-balance text-white italic">
                &ldquo;{memory.quote}&rdquo;
              </p>
            ) : null}

            <span
              aria-hidden="true"
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600"
            >
              <EyeIcon />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
