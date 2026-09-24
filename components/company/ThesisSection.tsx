'use client'

import { useState, useTransition } from 'react'

import { upsertThesis } from '@/app/actions/thesis'
import { CollapsibleText } from '@/components/CollapsibleText'
import { showToast } from '@/components/Toast'

// Same neutral "this navigates/opens" glyph as the Memory cards — a visual
// hint that the whole card is interactive, not a standalone control with
// its own limited click zone.
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
      showToast('Vastgelegd.')
      setEditing(false)
    })
  }

  function handleCancel() {
    setThesisText(initialThesisText)
    setInvalidationText(initialInvalidationText)
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setEditing(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setEditing(true)
          }
        }}
        className="relative w-full cursor-pointer rounded-2xl bg-blue-600 p-4 text-left"
      >
        <p className="pr-8 text-xs font-medium uppercase tracking-wide text-white/50">Jouw these</p>

        <div className="mt-3 flex flex-col gap-4 pr-8">
          <div>
            <p className="text-sm font-bold text-white/50">Waarom dit, waarom nu?</p>
            {hasThesis ? (
              <CollapsibleText
                text={initialThesisText}
                className="text-sm text-white"
                toggleClassName="text-white/70 hover:text-white"
              />
            ) : (
              <p className="mt-1 text-sm text-white/40">
                Nog geen these toegevoegd. Wat maakt dit bedrijf interessant voor jou?
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-white/50">Wat zou bewijzen dat je ongelijk hebt?</p>
            {hasInvalidation ? (
              <CollapsibleText
                text={initialInvalidationText}
                className="text-sm text-white"
                toggleClassName="text-white/70 hover:text-white"
              />
            ) : (
              <p className="mt-1 text-sm text-white/40">Nog niet ingevuld.</p>
            )}
          </div>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600"
        >
          <EyeIcon />
        </span>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Jouw these</p>

      <div className="mt-3 flex flex-col gap-4">
        <div>
          <label htmlFor="thesis-text" className="mb-1.5 block text-sm font-semibold text-slate-900">
            Waarom dit, waarom nu?
          </label>
          <textarea
            id="thesis-text"
            rows={3}
            value={thesisText}
            onChange={(e) => setThesisText(e.target.value)}
            placeholder="Leg het uit alsof je het over een jaar aan jezelf terugleest."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="invalidation-text" className="mb-1.5 block text-sm font-semibold text-slate-900">
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
    </section>
  )
}
