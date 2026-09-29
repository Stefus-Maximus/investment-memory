'use client'

import { useEffect, useRef, useState } from 'react'

import type { Lesson } from '@/lib/data/lessons'

import { LessonDetailSheet } from './LessonDetailSheet'
import { LessonTimelineItem } from './LessonTimelineItem'

export function LessonsTimeline({
  lessons,
  initialSelectedLessonId = null,
}: {
  lessons: Lesson[]
  initialSelectedLessonId?: string | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(lessons[0]?.id ?? null)
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null)
  const deepLinkHandled = useRef(false)

  function handleSelect(lesson: Lesson) {
    setSelectedId(lesson.id)
    setOpenLesson(lesson)
  }

  // Deep link from a search result (§ zoekfunctie) — same "land on it, opened"
  // treatment as a moment deep-linked from a Memory card on the homepage.
  // Deferred to a rAF callback (rather than called directly in the effect
  // body) to keep this an external-system sync, not a same-tick setState.
  //
  // Deliberately no cleanup cancelling the frame: `deepLinkHandled` already
  // guarantees this fires at most once, and in dev, Strict Mode's synchronous
  // mount→cleanup→mount would otherwise cancel the very first frame before it
  // ever paints, silently dropping the deep link.
  useEffect(() => {
    if (deepLinkHandled.current) return
    if (!initialSelectedLessonId) {
      deepLinkHandled.current = true
      return
    }
    const lesson = lessons.find((l) => l.id === initialSelectedLessonId)
    if (!lesson) return

    deepLinkHandled.current = true
    requestAnimationFrame(() => handleSelect(lesson))
  }, [initialSelectedLessonId, lessons])

  if (lessons.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-slate-400">
        Nog geen lessen vastgelegd. Tik rechtsonder op + om je eerste les op te schrijven.
      </p>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-2">
        {lessons.map((lesson, index) => (
          <LessonTimelineItem
            key={lesson.id}
            lesson={lesson}
            focused={lesson.id === selectedId}
            isLast={index === lessons.length - 1}
            onSelect={() => handleSelect(lesson)}
          />
        ))}
      </div>

      {openLesson ? (
        <LessonDetailSheet lesson={openLesson} onClose={() => setOpenLesson(null)} />
      ) : null}
    </>
  )
}
