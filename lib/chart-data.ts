import type { DailyPricePoint } from './market-data/yahoo-finance'

export type ChartRange = '1M' | '3M' | '1J' | 'Alle'

export interface ChartMomentInput {
  id: string
  occurredAt: string
  price: number
  currency: string | null
  kind: 'note' | 'conviction_change'
}

export interface ChartDataPoint {
  date: string
  close: number
  momentPrice: number | null
  momentId: string | null
  momentKind: 'note' | 'conviction_change' | null
  momentCurrency: string | null
  momentOccurredAt: string | null
}

function nearestBarIndex(dailyPrices: DailyPricePoint[], occurredAt: string): number {
  const target = new Date(occurredAt).getTime()
  let closestIndex = 0
  let closestDiff = Infinity
  for (let i = 0; i < dailyPrices.length; i++) {
    const diff = Math.abs(new Date(dailyPrices[i].date).getTime() - target)
    if (diff < closestDiff) {
      closestDiff = diff
      closestIndex = i
    }
  }
  return closestIndex
}

// Merges the daily price series with the moments that belong on it (§38:
// notes and conviction changes, never sources — callers must already have
// filtered those out and dropped anything with no price snapshot). Markets
// are closed on weekends/holidays, so a moment's occurred_at can land on a
// day with no bar; nearestBarIndex snaps its X position to the closest
// trading day. Its Y position stays the moment's own price_at_time — a
// frozen snapshot per §34 — never the bar's close, so plotting it here
// never rewrites what the user actually saw when they wrote it down.
export function buildPriceChartData(
  dailyPrices: DailyPricePoint[],
  moments: ChartMomentInput[]
): ChartDataPoint[] {
  const points: ChartDataPoint[] = dailyPrices.map((p) => ({
    date: p.date,
    close: p.close,
    momentPrice: null,
    momentId: null,
    momentKind: null,
    momentCurrency: null,
    momentOccurredAt: null,
  }))

  if (points.length === 0) return points

  // Oldest first, so that when two moments snap to the same trading day
  // (sparse data, or two same-day moments) the more recent one wins
  // deterministically rather than by array order.
  const sortedMoments = [...moments].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )

  for (const moment of sortedMoments) {
    const index = nearestBarIndex(dailyPrices, moment.occurredAt)
    points[index] = {
      ...points[index],
      momentPrice: moment.price,
      momentId: moment.id,
      momentKind: moment.kind,
      momentCurrency: moment.currency,
      momentOccurredAt: moment.occurredAt,
    }
  }

  return points
}

const RANGE_DAYS: Record<Exclude<ChartRange, 'Alle'>, number> = { '1M': 30, '3M': 90, '1J': 365 }
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function filterByRange(data: ChartDataPoint[], range: ChartRange): ChartDataPoint[] {
  if (range === 'Alle' || data.length === 0) return data
  const latest = new Date(data[data.length - 1].date).getTime()
  const cutoff = latest - RANGE_DAYS[range] * MS_PER_DAY
  return data.filter((point) => new Date(point.date).getTime() >= cutoff)
}

// §29: don't open on a wide range when the company has barely been
// followed — e.g. a handful of weeks since it was added shouldn't default
// to "1J" of near-empty chart. This app is a journal, not a market
// terminal — most companies will be followed for weeks or months, not
// years, so the shortest range is the common case, not the edge case.
//
// This only picks which range button is pre-selected — it must NOT be used
// to decide how much data getDailyPrices fetches. That was tried and
// reverted: scoping the fetch to the follow window meant "1J"/"Alle" had no
// more data in memory than "3M" already showed, so those buttons appeared
// to do nothing. The fetch always pulls the full capped history regardless
// of follow duration; only the default *selection* depends on it.
export function defaultRangeForFollowDuration(followingSince: string | null): ChartRange {
  if (!followingSince) return '1M'
  const ageDays = (Date.now() - new Date(followingSince).getTime()) / MS_PER_DAY
  if (ageDays <= 30) return '1M'
  if (ageDays <= 90) return '3M'
  if (ageDays <= 365) return '1J'
  return 'Alle'
}
