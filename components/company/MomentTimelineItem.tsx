'use client'

import type { Ref } from 'react'

import { MomentTypeBadge } from '@/components/MomentTypeBadge'
import { convictionChangeTitle } from '@/lib/conviction'
import { formatPrice, formatTimelineDate } from '@/lib/format'
import type { Database } from '@/lib/supabase/database.types'

export type MomentRow = Pick<
  Database['public']['Tables']['moments']['Row'],
  | 'id'
  | 'type'
  | 'content'
  | 'price_at_time'
  | 'price_currency'
  | 'source_url'
  | 'source_title'
  | 'conviction_from'
  | 'conviction_to'
  | 'occurred_at'
>

// A note has no separate title field — the first line doubles as the
// heading (bold), any following lines read as the lighter-weight body.
function splitNoteContent(content: string | null) {
  const lines = (content ?? '').split('\n')
  const [heading, ...rest] = lines
  return { heading, body: rest.join('\n').trim() }
}

// Same visual language as the chart dot (PriceChart's MomentDot/halo): grey
// when idle, blue with a soft translucent halo when selected, ~180ms fade.
// This is what makes "Mijn momenten" read as one continuous line running
// down the page rather than a stack of separate cards (§32).
function RailDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center justify-center"
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-blue-600/15 transition-opacity duration-[180ms] ${
          selected ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Opaque backing disc in the page background color — the connecting
          line sits behind the whole rail dot (z-10 above), but this also
          guarantees no sliver of it shows through at the dot's edge. */}
      <span className="absolute h-3 w-3 rounded-full bg-white" />
      <span
        className={`relative h-2.5 w-2.5 rounded-full transition-colors duration-[180ms] ${
          selected ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      />
    </span>
  )
}

// §33: the historical price always reads as context, never as "now" — the
// same line for a note and a conviction change, since both freeze a real
// quote at the moment they were written (§34).
function PriceContext({ moment }: { moment: MomentRow }) {
  return (
    <p className="mt-1.5 text-xs text-slate-400">
      Koers op dat moment ·{' '}
      {moment.price_at_time != null
        ? formatPrice(moment.price_at_time, moment.price_currency)
        : '€ —'}
    </p>
  )
}

// §39/§40: selection is a quiet blue emphasis — the same blue every moment
// already uses — never a judgement about the moment itself (§28, §43).
export function MomentTimelineItem({
  moment,
  ref,
  selected = false,
  onSelect,
  isLast = false,
}: {
  moment: MomentRow
  ref?: Ref<HTMLElement>
  selected?: boolean
  onSelect?: () => void
  isLast?: boolean
}) {
  // Badge label and primary content turn dark blue when selected; the
  // card's light-blue background (set below) is untouched by this.
  const primaryTextClass = selected ? 'text-blue-900' : 'text-slate-900'
  const noteTextClass = selected ? 'text-blue-900' : 'text-slate-700'
  const { heading: noteHeading, body: noteBody } = splitNoteContent(moment.content)

  const body = (
    <>
      <div className="flex items-center gap-2">
        <MomentTypeBadge type={moment.type} selected={selected} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {formatTimelineDate(moment.occurred_at)}
        </span>
      </div>

      {moment.type === 'source' ? (
        <div className="mt-2">
          <a
            href={moment.source_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`break-words text-sm font-semibold transition-colors duration-200 hover:underline ${primaryTextClass}`}
          >
            {moment.source_title}
          </a>
          {moment.content ? <p className="mt-1 text-sm text-slate-600">{moment.content}</p> : null}
        </div>
      ) : moment.type === 'conviction_change' ? (
        <div className="mt-2">
          <p className={`text-sm font-semibold transition-colors duration-200 ${primaryTextClass}`}>
            {convictionChangeTitle(moment.conviction_from, moment.conviction_to)}
          </p>
          {moment.content ? <p className="mt-1 text-sm text-slate-600">{moment.content}</p> : null}
          <PriceContext moment={moment} />
        </div>
      ) : (
        <div className="mt-2">
          <p className={`text-sm font-semibold transition-colors duration-200 ${primaryTextClass}`}>
            {noteHeading}
          </p>
          {noteBody ? (
            <p className={`mt-1 text-sm transition-colors duration-200 ${noteTextClass}`}>
              {noteBody}
            </p>
          ) : null}
          <PriceContext moment={moment} />
        </div>
      )}
    </>
  )

  return (
    <div className="flex gap-3">
      <div className="relative w-5 shrink-0">
        <RailDot selected={selected} />
        {!isLast ? (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-4 -bottom-7 z-0 w-px -translate-x-1/2 bg-slate-200"
          />
        ) : null}
      </div>

      <article
        ref={ref}
        className={`min-w-0 flex-1 rounded-xl border p-3 shadow-sm transition-[background-color,border-color,transform] duration-150 ease-out ${
          selected
            ? 'translate-x-1 border-blue-200 bg-blue-50/60'
            : 'translate-x-0 border-slate-100 bg-white'
        }`}
      >
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="w-full cursor-pointer text-left"
          >
            {body}
          </button>
        ) : (
          body
        )}
      </article>
    </div>
  )
}
