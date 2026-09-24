'use client'

import type { Ref } from 'react'

import type { Lesson } from '@/lib/data/lessons'
import { formatTimelineDate } from '@/lib/format'

// A lesson has no separate title field — the first line doubles as the bold
// heading, the rest previews underneath, clipped like the Memories cards on
// the homepage (§ pasted spec).
function splitLessonContent(content: string) {
  const lines = content.split('\n')
  const [heading, ...rest] = lines
  return { heading, body: rest.join('\n').trim() }
}

// Same neutral "this navigates/opens" glyph as the Memory/thesis cards.
function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

// Same rail-dot + connecting-line language as MomentTimelineItem on the
// company page (§39/§40's visual pattern), but in the lessons' own dark
// green accent — never the app's main blue, which is reserved for
// interactive/conviction elements — so "Mijn lessen" reads as its own,
// separate journal.
function RailDot({ focused }: { focused: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center justify-center"
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-green-700/15 transition-opacity duration-[180ms] ${
          focused ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span className="absolute h-3 w-3 rounded-full bg-white" />
      <span
        className={`relative h-2.5 w-2.5 rounded-full transition-colors duration-[180ms] ${
          focused ? 'bg-green-700' : 'bg-slate-300'
        }`}
      />
    </span>
  )
}

export function LessonTimelineItem({
  lesson,
  ref,
  focused = false,
  isLast = false,
  onOpen,
}: {
  lesson: Lesson
  ref?: Ref<HTMLElement>
  focused?: boolean
  isLast?: boolean
  onOpen: () => void
}) {
  const { heading, body } = splitLessonContent(lesson.content)

  // Same "geselecteerd"-patroon as the thesis/conviction/Memory cards: solid
  // dark green background, white bold primary text, white-at-50%-opacity
  // supporting text. No other color stands for "in focus" here.
  const dateTextClass = focused ? 'text-white/50' : 'text-green-700/80'
  const headingTextClass = focused ? 'text-white' : 'text-slate-900'
  const bodyTextClass = focused ? 'text-white/70' : 'text-slate-600'
  const eyeButtonClass = focused
    ? 'bg-white text-green-700'
    : 'text-green-700/60 hover:bg-green-700/10 hover:text-green-700'

  return (
    <div className="flex gap-3">
      <div className="relative w-5 shrink-0">
        <RailDot focused={focused} />
        {!isLast ? (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-4 -bottom-5 z-0 w-px -translate-x-1/2 bg-slate-200"
          />
        ) : null}
      </div>

      <article
        ref={ref}
        className={`relative min-w-0 flex-1 rounded-xl p-3 transition-[background-color,opacity] duration-[180ms] ease-out ${
          focused ? 'bg-green-700 opacity-100' : 'bg-transparent opacity-55'
        }`}
      >
        <p className={`pr-6 text-[11px] font-bold uppercase tracking-wide ${dateTextClass}`}>
          {formatTimelineDate(lesson.createdAt)}
        </p>

        <p className={`mt-1.5 pr-6 font-serif text-[16px] font-bold leading-relaxed ${headingTextClass}`}>
          {heading}
        </p>
        {body ? (
          <p className={`mt-1 line-clamp-2 pr-6 text-sm leading-relaxed ${bodyTextClass}`}>{body}</p>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          aria-label="Volledige les bekijken"
          className={`absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full ${eyeButtonClass}`}
        >
          <EyeIcon />
        </button>
      </article>
    </div>
  )
}
