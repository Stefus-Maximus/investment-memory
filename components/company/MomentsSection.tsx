'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChartDataPoint, ChartRange } from '@/lib/chart-data'

import { AddMomentSheet } from './AddMomentSheet'
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
  initialSelectedMomentId = null,
}: {
  moments: MomentRow[]
  chartData: ChartDataPoint[] | null
  currency: string
  defaultRange: ChartRange
  initialSelectedMomentId?: string | null
}) {
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(initialSelectedMomentId)
  const [editingMoment, setEditingMoment] = useState<MomentRow | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement | null>())
  const syncPausedUntil = useRef(0)
  const chartWrapperRef = useRef<HTMLDivElement | null>(null)

  // The sticky chart permanently covers the top slice of the viewport once
  // it's pinned (§ sticky chart request below) — read its live height rather
  // than a hardcoded number so the anchor/visibility math below still tracks
  // reality if the chart's own size ever changes.
  const getOcclusion = useCallback(() => chartWrapperRef.current?.getBoundingClientRect().height ?? 0, [])

  // Same anchor concept as before (§40's comment), just rebased onto the
  // viewport slice that's actually free of the sticky chart.
  const getAnchorY = useCallback(() => {
    const occlusion = getOcclusion()
    return occlusion + (window.innerHeight - occlusion) * ANCHOR_RATIO
  }, [getOcclusion])

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

  const hasChart = Boolean(chartData && chartData.length >= 2)

  // Feeds `scroll-pt-[var(--moment-scroll-anchor)]` on <html> (layout.tsx),
  // which pairs CSS scroll-snap with the exact same anchor line the JS sync
  // above/below uses — so a native snap (from a swipe) and a JS-driven
  // scrollBy (from a chart tap) always agree on where a card should rest,
  // instead of the browser correcting to a different spot after ours lands.
  useEffect(() => {
    const updateAnchorVar = () => {
      document.documentElement.style.setProperty('--moment-scroll-anchor', `${getAnchorY()}px`)
    }
    updateAnchorVar()

    window.addEventListener('resize', updateAnchorVar)
    const observer = new ResizeObserver(updateAnchorVar)
    if (chartWrapperRef.current) observer.observe(chartWrapperRef.current)

    return () => {
      window.removeEventListener('resize', updateAnchorVar)
      observer.disconnect()
      document.documentElement.style.removeProperty('--moment-scroll-anchor')
    }
  }, [getAnchorY, hasChart])

  // Chart → timeline (§39). Bring the entry into view only when it isn't
  // already fully readable, and land it exactly on the anchor line so that
  // the reverse sync agrees with us once the page settles.
  const selectFromChart = useCallback(
    (id: string) => {
      setSelectedMomentId(id)
      // Pause the reverse (timeline→chart) sync for every tap, not just the
      // ones that trigger a scroll — otherwise a tap on an already-visible
      // item leaves the listener armed, and the smallest incidental scroll
      // right after the tap (mobile momentum, focus-scroll from the dot's
      // tabIndex) can immediately overwrite the selection with whatever
      // happens to sit closest to the anchor line instead.
      syncPausedUntil.current = Date.now() + SCROLL_SYNC_PAUSE_MS

      const element = itemRefs.current.get(id)
      if (!element) return

      const occlusion = getOcclusion()
      const rect = element.getBoundingClientRect()
      if (rect.top >= occlusion && rect.bottom <= window.innerHeight) return

      window.scrollBy({
        top: rect.top - getAnchorY(),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [getAnchorY, getOcclusion]
  )

  const selectFromTimeline = useCallback((id: string) => {
    syncPausedUntil.current = Date.now() + 200
    setSelectedMomentId(id)
  }, [])

  // Deep link from a Memory card (§ homepage throwback → exact moment):
  // selection state is already set from `initialSelectedMomentId`, so this
  // only needs to bring that entry into view once, on arrival.
  useEffect(() => {
    if (!initialSelectedMomentId) return

    const element = itemRefs.current.get(initialSelectedMomentId)
    if (!element) return

    syncPausedUntil.current = Date.now() + SCROLL_SYNC_PAUSE_MS
    const rect = element.getBoundingClientRect()
    window.scrollBy({
      top: rect.top - getAnchorY(),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
    // Runs once, right after the initial refs are registered — not on every
    // change of the callbacks below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        const occlusion = getOcclusion()
        const anchor = getAnchorY()
        let closestId: string | null = null
        let closestDistance = Infinity

        for (const [id, element] of itemRefs.current) {
          if (!element || !plottedIds.has(id)) continue
          const rect = element.getBoundingClientRect()
          // Skip entries still hidden under the sticky chart, not just
          // entries below the viewport — otherwise a card sitting right
          // behind the chart could "win" the anchor even though the user
          // can't actually see it.
          if (rect.bottom < occlusion || rect.top > window.innerHeight) continue
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
  }, [plottedIds, getAnchorY, getOcclusion])

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Koersverloop</h2>
        <p className="mb-3 mt-0.5 text-sm text-slate-500">Jouw momenten staan op de koerslijn.</p>
      </div>

      {/* Sticky within `section`'s bounds, not just this block, so it stays
          pinned while "Mijn momenten" scrolls underneath it (§18: the two are
          one continuous section) and only scrolls away once the whole thing,
          timeline included, has passed. The title/subtitle above stay in
          normal flow on purpose — only the chart (+ its own range selector)
          pins. */}
      {chartData && chartData.length >= 2 ? (
        <div ref={chartWrapperRef} className="sticky top-0 z-20 border-b border-slate-100 bg-white pb-3">
          <PriceChart
            data={chartData}
            currency={currency}
            defaultRange={defaultRange}
            selectedMomentId={selectedMomentId}
            onSelectMoment={selectFromChart}
          />
        </div>
      ) : (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
          Koersdata nog niet beschikbaar voor dit bedrijf.
        </div>
      )}

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
                onEdit={moment.type !== 'conviction_change' ? () => setEditingMoment(moment) : undefined}
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

      {editingMoment ? (
        <AddMomentSheet editingMoment={editingMoment} onClose={() => setEditingMoment(null)} />
      ) : null}
    </section>
  )
}
