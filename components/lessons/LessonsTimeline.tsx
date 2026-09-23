'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Lesson } from '@/lib/data/lessons'

import { LessonDetailSheet } from './LessonDetailSheet'
import { LessonTimelineItem } from './LessonTimelineItem'

// The entry nearest this line, from the top of the viewport, counts as "in
// focus" — a plain reading-orientation aid local to this one list, with no
// coupling to any other component (unlike the company page's chart/timeline
// sync in MomentsSection).
const ANCHOR_RATIO = 0.22

export function LessonsTimeline({ lessons }: { lessons: Lesson[] }) {
  const [focusedId, setFocusedId] = useState<string | null>(lessons[0]?.id ?? null)
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement | null>())

  const registerItem = useCallback((id: string, element: HTMLElement | null) => {
    if (element) itemRefs.current.set(id, element)
    else itemRefs.current.delete(id)
  }, [])

  useEffect(() => {
    if (lessons.length === 0) return

    let frame = 0
    const handleScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const anchor = window.innerHeight * ANCHOR_RATIO
        let closestId: string | null = null
        let closestDistance = Infinity

        for (const [id, element] of itemRefs.current) {
          if (!element) continue
          const rect = element.getBoundingClientRect()
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue
          const distance = Math.abs(rect.top - anchor)
          if (distance < closestDistance) {
            closestDistance = distance
            closestId = id
          }
        }

        if (closestId) setFocusedId(closestId)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [lessons.length])

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
            ref={(element) => registerItem(lesson.id, element)}
            focused={lesson.id === focusedId}
            isLast={index === lessons.length - 1}
            onOpen={() => setOpenLesson(lesson)}
          />
        ))}
      </div>

      {openLesson ? (
        <LessonDetailSheet lesson={openLesson} onClose={() => setOpenLesson(null)} />
      ) : null}
    </>
  )
}
