'use client'

import { useState, useTransition } from 'react'

import { updateConviction } from '@/app/actions/conviction'
import { CONVICTION_UI_LEVELS, type ConvictionUILevel } from '@/lib/conviction'

const DOT_COUNT = 5

export function ConvictionEditSheet({
  companyId,
  currentLevel,
  onClose,
}: {
  companyId: string
  currentLevel: ConvictionUILevel
  onClose: () => void
}) {
  const [level, setLevel] = useState<ConvictionUILevel>(currentLevel)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateConviction({ companyId, level, reason })
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
          <span className="text-sm font-semibold text-slate-900">Overtuiging aanpassen</span>
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
          <div className="flex flex-col gap-4">
            <div role="radiogroup" aria-label="Overtuigingsniveau" className="flex gap-2">
              {CONVICTION_UI_LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={level === option.value}
                  onClick={() => setLevel(option.value)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-center transition-colors ${
                    level === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${
                      level === option.value ? 'text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="mt-1.5 flex items-center justify-center gap-1" aria-hidden="true">
                    {Array.from({ length: DOT_COUNT }, (_, i) => i + 1).map((dot) => (
                      <span
                        key={dot}
                        className={`h-1.5 w-1.5 rounded-full ${
                          dot <= option.score ? 'bg-blue-600' : 'bg-blue-200'
                        }`}
                      />
                    ))}
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label
                htmlFor="conviction-reason"
                className="mb-1.5 block text-sm font-medium text-slate-900"
              >
                Waarom verandert je overtuiging?
              </label>
              <textarea
                id="conviction-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optioneel..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
