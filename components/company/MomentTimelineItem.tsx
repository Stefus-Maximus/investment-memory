'use client'

import type { Ref } from 'react'

import { CollapsibleText } from '@/components/CollapsibleText'
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
function PriceContext({ moment, selected }: { moment: MomentRow; selected: boolean }) {
  return (
    <p className={`mt-1.5 text-xs ${selected ? 'text-white/50' : 'text-slate-400'}`}>
      Koers op dat moment ·{' '}
      {moment.price_at_time != null
        ? formatPrice(moment.price_at_time, moment.price_currency)
        : '€ —'}
    </p>
  )
}

// Same pencil glyph as ConvictionLevel's edit affordance — one visual
// language for "this is editable" across the page.
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M14.5 3.5a1.5 1.5 0 0 1 2 2L7 15l-3.5 1L4.5 12.5 14.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// §39/§40: selection is a quiet blue emphasis — the same blue every moment
// already uses — never a judgement about the moment itself (§28, §43).
export function MomentTimelineItem({
  moment,
  ref,
  selected = false,
  onSelect,
  onEdit,
  isLast = false,
}: {
  moment: MomentRow
  ref?: Ref<HTMLElement>
  selected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  isLast?: boolean
}) {
  // §"geselecteerd"-patroon: one blue card treatment everywhere — solid
  // blue background, white primary text, white-at-50%-opacity supporting
  // text. No other color stands for "active".
  const primaryTextClass = selected ? 'text-white' : 'text-slate-900'
  const noteTextClass = selected ? 'text-white/70' : 'text-slate-700'
  const secondaryTextClass = selected ? 'text-white/50' : 'text-slate-400'

  const body = (
    <>
      <div className="flex items-center gap-2">
        <MomentTypeBadge type={moment.type} selected={selected} />
        <span className={`text-[11px] font-medium uppercase tracking-wide ${secondaryTextClass}`}>
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
          {moment.content ? (
            <CollapsibleText
              text={moment.content}
              className={`text-sm ${noteTextClass}`}
              toggleClassName={selected ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-600'}
            />
          ) : null}
        </div>
      ) : moment.type === 'conviction_change' ? (
        <div className="mt-2">
          <p className={`text-sm font-semibold transition-colors duration-200 ${primaryTextClass}`}>
            {convictionChangeTitle(moment.conviction_from, moment.conviction_to)}
          </p>
          {moment.content ? <p className={`mt-1 text-sm ${noteTextClass}`}>{moment.content}</p> : null}
          <PriceContext moment={moment} selected={selected} />
        </div>
      ) : (
        <div className="mt-2">
          <CollapsibleText
            text={moment.content ?? ''}
            className={`text-sm transition-colors duration-200 ${primaryTextClass}`}
            toggleClassName={selected ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-600'}
          />
          <PriceContext moment={moment} selected={selected} />
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
        // snap-start on the exact element MomentsSection measures with
        // getBoundingClientRect() (§40) — so the browser's own snap point and
        // the JS anchor line describe the same position, not two competing
        // ones.
        className={`relative min-w-0 flex-1 snap-start rounded-xl border p-3 shadow-sm transition-[background-color,border-color,transform] duration-150 ease-out ${
          selected
            ? 'translate-x-1 border-blue-600 bg-blue-600'
            : 'translate-x-0 border-slate-100 bg-white'
        }`}
      >
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Moment bewerken"
            className={`absolute right-2.5 top-2.5 z-10 ${
              selected ? 'text-white/50 hover:text-white' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            <EditIcon />
          </button>
        ) : null}

        {onSelect ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect()
              }
            }}
            aria-pressed={selected}
            className={`w-full cursor-pointer text-left ${onEdit ? 'pr-5' : ''}`}
          >
            {body}
          </div>
        ) : (
          <div className={onEdit ? 'pr-5' : undefined}>{body}</div>
        )}
      </article>
    </div>
  )
}
