'use client'

import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DotProps } from 'recharts'

import { formatLongDate, formatPrice } from '@/lib/format'
import type { ChartDataPoint, ChartRange } from '@/lib/chart-data'
import { filterByRange } from '@/lib/chart-data'

const RANGE_OPTIONS: ChartRange[] = ['1J', '3J', '5J', 'Alle']

// §27: the price line is light, calm, thin — never the thing that draws the
// eye. §4.2: blue is the app's one accent, reserved for the user's own
// moments, never used to encode whether a moment "worked out" (§28).
const LINE_COLOR = '#94a3b8' // slate-400
const MOMENT_COLOR = '#2563eb' // blue-600

const MOMENT_LABELS: Record<string, string> = {
  note: 'Notitie',
  conviction_change: 'Overtuiging',
}

function formatAxisTick(date: string, spanDays: number) {
  const parsed = new Date(date)
  // A range spanning more than ~1.5 years reads better as bare years than
  // as a wall of "sep '24" labels.
  if (spanDays > 550) {
    return new Intl.DateTimeFormat('nl-NL', { year: 'numeric' }).format(parsed)
  }
  return new Intl.DateTimeFormat('nl-NL', { month: 'short', year: '2-digit' }).format(parsed)
}

function pickTicks(data: ChartDataPoint[], count = 4): string[] {
  if (data.length <= count) return data.map((point) => point.date)
  const step = (data.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => data[Math.round(i * step)].date)
}

// A dot is only ~4px wide, far below a comfortable touch target, so an
// invisible circle around it catches taps that land just next to the moment.
const HIT_RADIUS = 14

// Growing/shrinking the dot rather than snapping it keeps the coupling with
// the timeline calm (§42) — short and subtle, never an animation that draws
// attention to itself.
const DOT_TRANSITION = { transition: 'r 180ms ease, opacity 180ms ease' }

// All moments get the identical treatment — same color, same size — on
// purpose (§28): nothing here may hint whether a moment aged well or badly.
// The one exception is selection, which says "this is the one you're looking
// at right now", not "this one was good".
function MomentDot(
  props: DotProps & {
    payload?: ChartDataPoint
    selectedMomentId?: string | null
    onSelectMoment?: (id: string) => void
  }
) {
  const { cx, cy, payload, selectedMomentId, onSelectMoment } = props
  if (cx == null || cy == null || payload?.momentPrice == null || !payload.momentId) return null

  const momentId = payload.momentId
  const selected = momentId === selectedMomentId
  const label = `${MOMENT_LABELS[payload.momentKind ?? ''] ?? 'Moment'} van ${formatLongDate(
    payload.momentOccurredAt ?? payload.date
  )}`

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      className="cursor-pointer focus:outline-none"
      onClick={() => onSelectMoment?.(momentId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelectMoment?.(momentId)
        }
      }}
    >
      <circle cx={cx} cy={cy} r={HIT_RADIUS} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={selected ? 10 : 0}
        fill={MOMENT_COLOR}
        fillOpacity={selected ? 0.16 : 0}
        style={DOT_TRANSITION}
      />
      <circle
        cx={cx}
        cy={cy}
        r={selected ? 6 : 4}
        fill={MOMENT_COLOR}
        stroke="#fff"
        strokeWidth={2}
        style={DOT_TRANSITION}
      />
    </g>
  )
}

function MomentActiveDot(
  props: DotProps & { payload?: ChartDataPoint; selectedMomentId?: string | null }
) {
  const { cx, cy, payload, selectedMomentId } = props
  if (cx == null || cy == null || payload?.momentPrice == null) return null
  // Hovering a moment that is already selected shouldn't visibly shrink it.
  const selected = payload.momentId != null && payload.momentId === selectedMomentId
  return (
    <g className="pointer-events-none">
      <circle cx={cx} cy={cy} r={selected ? 10 : 9} fill={MOMENT_COLOR} fillOpacity={0.16} />
      <circle
        cx={cx}
        cy={cy}
        r={selected ? 6 : 5}
        fill={MOMENT_COLOR}
        stroke="#fff"
        strokeWidth={2}
      />
    </g>
  )
}

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { payload: ChartDataPoint }[]
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  const isMoment = point.momentPrice != null
  const price = isMoment ? point.momentPrice! : point.close
  const priceCurrency = isMoment ? (point.momentCurrency ?? currency) : currency
  const dateSource = isMoment && point.momentOccurredAt ? point.momentOccurredAt : point.date
  const dateLabel = formatLongDate(dateSource)

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="text-slate-400">{dateLabel}</p>
      <p className="mt-0.5 font-semibold text-slate-900">{formatPrice(price, priceCurrency)}</p>
      {isMoment ? (
        <p className="mt-0.5 font-medium text-blue-600">
          {MOMENT_LABELS[point.momentKind ?? ''] ?? 'Moment'}
        </p>
      ) : null}
    </div>
  )
}

export function PriceChart({
  data,
  currency,
  defaultRange,
  selectedMomentId = null,
  onSelectMoment,
}: {
  data: ChartDataPoint[]
  currency: string
  defaultRange: ChartRange
  selectedMomentId?: string | null
  onSelectMoment?: (id: string) => void
}) {
  const [range, setRange] = useState<ChartRange>(defaultRange)

  const filtered = useMemo(() => filterByRange(data, range), [data, range])

  const spanDays = useMemo(() => {
    if (filtered.length < 2) return 0
    const first = new Date(filtered[0].date).getTime()
    const last = new Date(filtered[filtered.length - 1].date).getTime()
    return (last - first) / (24 * 60 * 60 * 1000)
  }, [filtered])

  const ticks = useMemo(() => pickTicks(filtered), [filtered])

  const yDomain = useMemo<[number, number]>(() => {
    const closes = filtered.map((point) => point.close)
    if (closes.length === 0) return [0, 1]
    const min = Math.min(...closes)
    const max = Math.max(...closes)
    const padding = (max - min) * 0.08 || max * 0.05 || 1
    return [min - padding, max + padding]
  }, [filtered])

  return (
    <div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="date"
              ticks={ticks}
              interval="preserveStartEnd"
              tickFormatter={(value: string) => formatAxisTick(value, spanDays)}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={yDomain} />
            <Tooltip
              content={<ChartTooltip currency={currency} />}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={LINE_COLOR}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              dataKey="momentPrice"
              stroke="none"
              dot={<MomentDot selectedMomentId={selectedMomentId} onSelectMoment={onSelectMoment} />}
              activeDot={<MomentActiveDot selectedMomentId={selectedMomentId} />}
              isAnimationActive={false}
              connectNulls={false}
              legendType="none"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex justify-center gap-1">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            aria-pressed={range === option}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              range === option
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
