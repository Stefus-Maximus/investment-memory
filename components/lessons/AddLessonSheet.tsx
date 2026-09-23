'use client'

import { useState, useTransition } from 'react'

import { createLesson } from '@/app/actions/lessons'

// One text field, one type of entry — no choice step, unlike AddMomentSheet.
export function AddLessonSheet({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!content.trim()) {
      setError('Schrijf op welke les je hieruit trekt.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createLesson(content)
      if (!result.success) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

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
          <span className="text-sm font-semibold text-slate-900">Nieuwe les</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <label htmlFor="lesson-content" className="text-sm font-medium text-slate-900">
            Welke les trek je hieruit?
          </label>
          <textarea
            id="lesson-content"
            autoFocus
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Schrijf op wat je geleerd hebt..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
          >
            {isPending ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </>
  )
}
