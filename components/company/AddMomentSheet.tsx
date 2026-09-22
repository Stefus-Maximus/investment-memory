'use client'

import { useState, useTransition } from 'react'

import { createMoment } from '@/app/actions/moments'

type Step = 'choice' | 'note' | 'source'

export function AddMomentSheet({
  companyId,
  onClose,
}: {
  companyId: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('choice')
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceReflection, setSourceReflection] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSaveNote() {
    if (!content.trim()) {
      setError('Schrijf op wat er door je hoofd gaat.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createMoment({ companyId, type: 'note', content })
      if (!result.success) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  function handleSaveSource() {
    if (!sourceUrl.trim() || !sourceTitle.trim()) {
      setError('Vul een URL en titel in.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createMoment({
        companyId,
        type: 'source',
        sourceUrl,
        sourceTitle,
        content: sourceReflection,
      })
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
          {step !== 'choice' ? (
            <button
              type="button"
              onClick={() => {
                setStep('choice')
                setError(null)
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ‹ Terug
            </button>
          ) : (
            <span className="text-sm font-semibold text-slate-900">Nieuwe toevoeging</span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {step === 'choice' ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setStep('note')}
                className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Notitie
              </button>
              <button
                type="button"
                onClick={() => setStep('source')}
                className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Bron
              </button>
            </div>
          ) : step === 'note' ? (
            <div className="flex flex-col gap-3">
              <label htmlFor="note-content" className="text-sm font-medium text-slate-900">
                Wat denk je nu?
              </label>
              <textarea
                id="note-content"
                autoFocus
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Schrijf op wat er door je hoofd gaat..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400">
                Je koers wordt automatisch opgeslagen als marktcontext.
              </p>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="source-url"
                  className="mb-1.5 block text-sm font-medium text-slate-900"
                >
                  URL
                </label>
                <input
                  id="source-url"
                  type="url"
                  autoFocus
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="source-title"
                  className="mb-1.5 block text-sm font-medium text-slate-900"
                >
                  Titel
                </label>
                <input
                  id="source-title"
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="Titel van het artikel"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="source-reflection"
                  className="mb-1.5 block text-sm font-medium text-slate-900"
                >
                  Wat betekent dit voor jou? (optioneel)
                </label>
                <textarea
                  id="source-reflection"
                  rows={3}
                  value={sourceReflection}
                  onChange={(e) => setSourceReflection(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="button"
                onClick={handleSaveSource}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
