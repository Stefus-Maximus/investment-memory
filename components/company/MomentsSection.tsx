'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChartDataPoint, ChartRange } from '@/lib/chart-data'

import { AddMomentSheet } from './AddMomentSheet'
import { MomentTimelineItem, type MomentRow } from './MomentTimelineItem'
import { PriceChart } from './PriceChart'

// A smooth scroll travels across every card between here and its target, so
// the observer would strobe the selection along the way. Ignore it until the
// scroll has settled; the tap already told us which moment wins.
const PROGRAMMATIC_SCROLL_SETTLE_MS = 800

// `pb-28` on the company page's <main>. The tail spacer below only has to
// make up whatever the page doesn't already leave under the last card.
const PAGE_BOTTOM_PADDING = 112

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// §18/§41: Koersverloop and Mijn momenten are one continuous section, not two
// screens — and §39/§40 make them one interaction too.
//
// The whole coupling rests on a single number: the height of the sticky
// chart. It is the page's scroll-padding (so native scroll-snap parks a card
// exactly under the chart), each card's scroll-margin (so scrollIntoView
// lands in that same place), and the top inset of the IntersectionObserver
// root (so "intersecting" literally means "still visible below the chart").
// Because all three derive from one measurement, the browser's snapping and
// our own selection can't disagree about where a card belongs.
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
  const [chartHeight, setChartHeight] = useState(0)
  const [tailSpace, setTailSpace] = useState(0)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const snapSentinelRef = useRef<HTMLSpanElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const ignoreObserverUntil = useRef(0)
  const deepLinkHandled = useRef(false)

  const hasChart = Boolean(chartData && chartData.length >= 2)
  const orderedIds = useMemo(() => moments.map((moment) => moment.id), [moments])

  const registerItem = useCallback((id: string, element: HTMLElement | null) => {
    if (element) itemRefs.current.set(id, element)
    else itemRefs.current.delete(id)
  }, [])

  // Note: whether a moment has a dot on the line is purely the chart's
  // business — sources are never plotted (§38), and a moment loses its dot if
  // a later one snapped to the same trading day. It deliberately no longer
  // decides anything about the timeline: every card is selectable, which is
  // what used to leave the middle of the list inert.

  // Measure the sticky chart rather than hardcoding its height — the range
  // selector can wrap, fonts load late, and the viewport rotates.
  useEffect(() => {
    const element = chartRef.current
    if (!element) {
      setChartHeight(0)
      return
    }

    const measure = () => setChartHeight(Math.round(element.getBoundingClientRect().height))
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasChart])

  // The single source of truth for "directly under the chart". The browser
  // applies scroll-padding-top to both things that move the page here: native
  // scroll-snap and scrollIntoView. That's why the cards themselves carry no
  // scroll-margin-top — it would be added on top of this and park every card
  // a full chart-height too low.
  useEffect(() => {
    const root = document.documentElement
    root.style.scrollPaddingTop = `${chartHeight}px`
    return () => {
      root.style.scrollPaddingTop = ''
    }
  }, [chartHeight])

  // Scroll-snap is switched on only once the first card has reached its
  // resting place under the chart, and off again above it. Left on for the
  // whole page it would reach roughly a quarter of a viewport past the first
  // card and drag the reader off the thesis mid-sentence — measurably, not
  // theoretically: at 390×844 a scroll to 180px was pulled to 387px.
  //
  // The sentinel sits at exactly the first card's snap position, so the
  // switch always flips at the moment the page is already standing on a snap
  // point and nothing visibly moves. Detecting that with the same observer
  // the selection uses keeps every "where am I" question in one mechanism.
  useEffect(() => {
    const sentinel = snapSentinelRef.current
    const root = document.documentElement
    if (!sentinel) {
      root.style.scrollSnapType = ''
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.rootBounds) return
        // Not intersecting can mean either "still below the fold" or "already
        // scrolled past the top of the list"; only the latter enables snap.
        const pastFirstCard =
          !entry.isIntersecting && entry.boundingClientRect.top <= entry.rootBounds.top
        // Proximity, never mandatory: mandatory would make the page refuse to
        // rest anywhere but on a card, including on the way out of the list.
        root.style.scrollSnapType = pastFirstCard ? 'y proximity' : 'none'
      },
      { rootMargin: `-${chartHeight}px 0px 0px 0px`, threshold: 0 }
    )
    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      root.style.scrollSnapType = ''
    }
  }, [chartHeight, moments.length])

  // Without this, the last card can never reach the slot under the chart —
  // the page simply runs out of scroll first — and "click any card" would
  // quietly stop working at the bottom of the list.
  useEffect(() => {
    // No cards means no spacer is rendered at all, so there is nothing to
    // reset here.
    const lastId = orderedIds[orderedIds.length - 1]
    if (!lastId) return

    const measure = () => {
      const element = itemRefs.current.get(lastId)
      const lastHeight = element?.getBoundingClientRect().height ?? 0
      setTailSpace(
        Math.max(0, Math.round(window.innerHeight - chartHeight - lastHeight - PAGE_BOTTOM_PADDING))
      )
    }
    measure()

    window.addEventListener('resize', measure)
    const observer = new ResizeObserver(measure)
    const element = itemRefs.current.get(lastId)
    if (element) observer.observe(element)

    return () => {
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [orderedIds, chartHeight])

  // Timeline → chart (§40). The selected moment is the topmost card that is
  // still visible below the chart, whichever card that happens to be. The
  // observer's negative top margin pulls the root's top edge down to the
  // chart's bottom edge, so a card stops "intersecting" at the exact instant
  // it disappears behind the chart — no scroll maths, no per-frame
  // getBoundingClientRect, and the browser decides when the line is crossed.
  useEffect(() => {
    if (orderedIds.length === 0) return

    const visible = new Set<string>()
    // The observer's first callback only reports the state the page already
    // loaded in; nothing has been scrolled yet, so it must not light up a
    // card. Arriving on the page should feel calm (§42), not pre-judged.
    let primed = false

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.momentId
          if (!id) continue
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        }

        if (!primed) {
          primed = true
          return
        }
        if (Date.now() < ignoreObserverUntil.current) return

        const topmost = orderedIds.find((id) => visible.has(id))
        // No card in view at all (scrolled past the section): keep the last
        // selection rather than clearing it, so scrolling back doesn't blink.
        if (topmost) setSelectedMomentId(topmost)
      },
      { rootMargin: `-${chartHeight}px 0px 0px 0px`, threshold: 0 }
    )

    for (const id of orderedIds) {
      const element = itemRefs.current.get(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [orderedIds, chartHeight])

  // The one way a moment becomes selected on purpose — from a tap on the
  // card itself (§39: the whole card, not a small glyph on it) or on its dot
  // in the chart. Both park the card directly under the chart, using the
  // card's own scroll-margin-top rather than any hand-rolled offset maths.
  const focusMoment = useCallback((id: string) => {
    setSelectedMomentId(id)
    ignoreObserverUntil.current = Date.now() + PROGRAMMATIC_SCROLL_SETTLE_MS

    itemRefs.current.get(id)?.scrollIntoView({
      block: 'start',
      inline: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [])

  // Deep link from a Memory card (§ homepage throwback → exact moment). Wait
  // for the chart measurement, otherwise the card scrolls to an offset of 0
  // and lands underneath the chart it was supposed to sit below — and let the
  // browser paint that measurement before scrolling to it.
  useEffect(() => {
    if (deepLinkHandled.current) return
    if (!initialSelectedMomentId) {
      deepLinkHandled.current = true
      return
    }
    if (hasChart && chartHeight === 0) return

    deepLinkHandled.current = true
    const frame = requestAnimationFrame(() => focusMoment(initialSelectedMomentId))
    return () => cancelAnimationFrame(frame)
  }, [initialSelectedMomentId, hasChart, chartHeight, focusMoment])

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Koersverloop</h2>
        <p className="mb-3 mt-0.5 text-sm text-slate-500">Jouw momenten staan op de koerslijn.</p>
      </div>

      {/* Sticky within `section`'s bounds, so it stays pinned while "Mijn
          momenten" scrolls underneath it (§18: the two are one continuous
          section) and only scrolls away once the whole thing has passed.
          `-mx-4 px-4` bleeds the white backdrop out to the page's own edges:
          a card passing behind it has to be covered across the full width,
          including the timeline rail, or its corners show alongside the
          chart. */}
      {chartData && chartData.length >= 2 ? (
        <div
          ref={chartRef}
          data-chart-sticky=""
          className="sticky top-0 z-30 -mx-4 border-b border-slate-100 bg-white px-4 pb-3"
        >
          <PriceChart
            data={chartData}
            currency={currency}
            defaultRange={defaultRange}
            selectedMomentId={selectedMomentId}
            onSelectMoment={focusMoment}
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
          <>
            <div className="relative mt-3 flex flex-col gap-3">
              {/* Marks the top of the list — i.e. the first card's snap
                  position — for the snap-toggle observer above. Absolute and
                  1px tall so it costs the layout nothing. */}
              <span
                ref={snapSentinelRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
              />
              {moments.map((moment, index) => (
                <MomentTimelineItem
                  key={moment.id}
                  moment={moment}
                  ref={(element) => registerItem(moment.id, element)}
                  selected={moment.id === selectedMomentId}
                  onSelect={() => focusMoment(moment.id)}
                  onEdit={
                    moment.type !== 'conviction_change' ? () => setEditingMoment(moment) : undefined
                  }
                  isLast={index === moments.length - 1}
                />
              ))}
            </div>
            <div aria-hidden="true" style={{ height: tailSpace }} />
          </>
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
