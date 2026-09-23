'use client'

import type { Lesson } from '@/lib/data/lessons'
import { formatTimelineDate } from '@/lib/format'

// Read-only bottom sheet for the untruncated text behind a timeline preview
// — same sheet shell as AddLessonSheet/AddMomentSheet, just showing rather
// than collecting text.
export function LessonDetailSheet({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  return (
    <>
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/30"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
            {formatTimelineDate(lesson.createdAt)}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <p className="font-serif text-[17px] leading-relaxed whitespace-pre-wrap text-slate-800">
            {lesson.content}
          </p>
        </div>
      </div>
    </>
  )
}
