'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChartDataPoint, ChartRange } from '@/lib/chart-data'

import { MomentTimelineItem, type MomentRow } from './MomentTimelineItem'
import { PriceChart } from './PriceChart'

// The timeline entry that counts as "active" while scrolling is the one
// nearest this line — a bit above the middle of the viewport, where the eye
// naturally rests while reading downward (§40).
const ANCHOR_RATIO = 0.35

// After a chart tap we scroll the timeline ourselves. That scrolling fires
// scroll events, so the timeline→chart sync is paused briefly; without this
// the selection would flicker across every entry we pass on the way.
const SCROLL_SYNC_PAUSE_MS = 900

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// §18/§41: Koersverloop and Mijn momenten are one continuous section, not two
// screens — and §39/§40 make them one interaction too. Both halves read the
// same selected-moment id from here, so a tap on the chart and a scroll
// through the timeline can never disagree about which moment is in focus.
export function MomentsSection({
  moments,
  chartData,
  currency,
  defaultRange,
}: {
  moments: MomentRow[]
  chartData: ChartDataPoint[] | null
  currency: string
  defaultRange: ChartRange
}) {
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement | null>())
  const syncPausedUntil = useRef(0)

  // Only moments that actually ended up on the line can take part in the
  // coupling: sources are never plotted (§38), and a moment can lose its dot
  // if another one snapped to the same trading day.
  const plottedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const point of chartData ?? []) {
      if (point.momentId) ids.add(point.momentId)
    }
    return ids
  }, [chartData])

  const registerItem = useCallback((id: string, element: HTMLElement | null) => {
    if (element) itemRefs.current.set(id, element)
    else itemRefs.current.delete(id)
  }, [])

  // Chart → timeline (§39). Bring the entry into view only when it isn't
  // already fully readable, and land it exactly on the anchor line so that
  // the reverse sync agrees with us once the page settles.
  const selectFromChart = useCallback((id: string) => {
    setSelectedMomentId(id)

    const element = itemRefs.current.get(id)
    if (!element) return

    const rect = element.getBoundingClientRect()
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) return

    syncPausedUntil.current = Date.now() + SCROLL_SYNC_PAUSE_MS
    window.scrollBy({
      top: rect.top - window.innerHeight * ANCHOR_RATIO,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [])

  const selectFromTimeline = useCallback((id: string) => {
    syncPausedUntil.current = Date.now() + 200
    setSelectedMomentId(id)
  }, [])

  // Timeline → chart (§40). Deliberately only on real scrolling, never on
  // mount: arriving on the page should show a calm chart, not one that has
  // already picked a moment for you.
  useEffect(() => {
    if (plottedIds.size === 0) return

    let frame = 0
    const handleScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (Date.now() < syncPausedUntil.current) return

        const anchor = window.innerHeight * ANCHOR_RATIO
        let closestId: string | null = null
        let closestDistance = Infinity

        for (const [id, element] of itemRefs.current) {
          if (!element || !plottedIds.has(id)) continue
          const rect = element.getBoundingClientRect()
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue
          const distance = Math.abs(rect.top - anchor)
          if (distance < closestDistance) {
            closestDistance = distance
            closestId = id
          }
        }

        if (closestId) setSelectedMomentId(closestId)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [plottedIds])

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Koersverloop</h2>
        <p className="mt-0.5 text-sm text-slate-500">Jouw momenten staan op de koerslijn.</p>
        {chartData && chartData.length >= 2 ? (
          <div className="mt-3">
            <PriceChart
              data={chartData}
              currency={currency}
              defaultRange={defaultRange}
              selectedMomentId={selectedMomentId}
              onSelectMoment={selectFromChart}
            />
          </div>
        ) : (
          <div className="mt-3 flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
            Koersdata nog niet beschikbaar voor dit bedrijf.
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Mijn momenten</h2>
        {moments.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {moments.map((moment, index) => (
              <MomentTimelineItem
                key={moment.id}
                moment={moment}
                ref={(element) => registerItem(moment.id, element)}
                selected={moment.id === selectedMomentId}
                onSelect={
                  plottedIds.has(moment.id) ? () => selectFromTimeline(moment.id) : undefined
                }
                isLast={index === moments.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
            Nog geen moment vastgelegd voor dit bedrijf.
          </div>
        )}
      </div>
    </section>
  )
}
