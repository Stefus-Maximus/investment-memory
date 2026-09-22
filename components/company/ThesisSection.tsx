'use client'

import { useState, useTransition } from 'react'

import { upsertThesis } from '@/app/actions/thesis'

export function ThesisSection({
  companyId,
  thesisText: initialThesisText,
  invalidationText: initialInvalidationText,
}: {
  companyId: string
  thesisText: string
  invalidationText: string
}) {
  const [editing, setEditing] = useState(false)
  const [thesisText, setThesisText] = useState(initialThesisText)
  const [invalidationText, setInvalidationText] = useState(initialInvalidationText)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasThesis = initialThesisText.trim().length > 0
  const hasInvalidation = initialInvalidationText.trim().length > 0

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await upsertThesis({ companyId, thesisText, invalidationText })
      if (!result.success) {
        setError(result.error)
        return
      }
      setEditing(false)
    })
  }

  function handleCancel() {
    setThesisText(initialThesisText)
    setInvalidationText(initialInvalidationText)
    setError(null)
    setEditing(false)
  }

  return (
    <section
      className={
        editing
          ? 'rounded-2xl border border-slate-200 bg-white p-4'
          : 'rounded-2xl bg-blue-50 p-4'
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Jouw these</p>

      {editing ? (
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <label
              htmlFor="thesis-text"
              className="mb-1.5 block text-sm font-semibold text-slate-900"
            >
              Waarom dit, waarom nu?
            </label>
            <textarea
              id="thesis-text"
              rows={3}
              value={thesisText}
              onChange={(e) => setThesisText(e.target.value)}
              placeholder="Wat maakt dit bedrijf interessant voor jou?"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="invalidation-text"
              className="mb-1.5 block text-sm font-semibold text-slate-900"
            >
              Wat zou bewijzen dat je ongelijk hebt?
            </label>
            <textarea
              id="invalidation-text"
              rows={3}
              value={invalidationText}
              onChange={(e) => setInvalidationText(e.target.value)}
              placeholder="Wanneer zou je overtuiging wankelen?"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Waarom dit, waarom nu?</p>
            {hasThesis ? (
              <p className="mt-1 text-sm text-slate-600">{initialThesisText}</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Nog geen these toegevoegd. Wat maakt dit bedrijf interessant voor jou?
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + These toevoegen
                </button>
              </>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Wat zou bewijzen dat je ongelijk hebt?
            </p>
            {hasInvalidation ? (
              <p className="mt-1 text-sm text-slate-600">{initialInvalidationText}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Nog niet ingevuld.</p>
            )}
          </div>

          {hasThesis ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="self-start text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ✎ Bewerken
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
