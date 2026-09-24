'use client'

import { useState, useTransition } from 'react'

import { createInvestmentRule } from '@/app/actions/investment-rules'
import { showToast } from '@/components/Toast'
import type { InvestmentRule } from '@/lib/data/investment-rules'

const COLLAPSED_COUNT = 3

function ChevronIcon({ direction }: { direction: 'down' | 'up' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={direction === 'up' ? 'rotate-180' : undefined}
    >
      <path d="M4.5 7.5 10 13l5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Minimal, single-line add form — a rule is always the same kind of short,
// free text, so there's no reason for a full form or a separate sheet.
function AddRuleForm({ onDone }: { onDone: () => void }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!content.trim()) {
      setError('Schrijf de regel op voordat je opslaat.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createInvestmentRule(content)
      if (!result.success) {
        setError(result.error)
        return
      }
      showToast('Vastgelegd.')
      onDone()
    })
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <input
        type="text"
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Bijv. koop nooit iets binnen 24 uur na het idee"
        className="w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
      />
      {error ? <p className="text-xs text-white/80">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-white/90 disabled:opacity-60"
        >
          {isPending ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white"
        >
          Annuleren
        </button>
      </div>
    </div>
  )
}

// §1: Blue card, same treatment as ThesisSection/ConvictionLevel — the app's
// one visual language for "this is a standing, personal commitment" rather
// than a logged moment. Rules never appear on a timeline: they're not
// something that happened, they're a fixed constraint the user set for
// themselves.
export function RulesCard({ rules }: { rules: InvestmentRule[] }) {
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)

  const hasRules = rules.length > 0
  const hasMore = rules.length > COLLAPSED_COUNT
  // "Uitgeklapt" in spirit even without a toggle once every rule already
  // fits in the collapsed view — that's when "+ Regel toevoegen" belongs
  // inside the card rather than only after a user with 4+ rules expands it.
  const allVisible = expanded || !hasMore
  const visibleRules = allVisible ? rules : rules.slice(0, COLLAPSED_COUNT)

  return (
    <section className="relative rounded-2xl bg-blue-600 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-white/60">
        Mijn vaste beleggingsregels
      </p>

      {hasRules ? (
        <div className="relative mt-3">
          <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-white">
            {visibleRules.map((rule) => (
              <li key={rule.id}>{rule.content}</li>
            ))}
          </ul>

          {!allVisible ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-blue-600 to-transparent"
            />
          ) : null}
        </div>
      ) : !adding ? (
        <p className="mt-3 text-sm text-white/70">
          Nog geen vaste regels vastgelegd — bijvoorbeeld: &ldquo;koop nooit iets binnen 24 uur na
          het idee&rdquo;.
        </p>
      ) : null}

      {hasRules && hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white"
        >
          {expanded ? 'Toon minder' : `Toon alle regels (${rules.length})`}
          <ChevronIcon direction={expanded ? 'up' : 'down'} />
        </button>
      ) : null}

      {adding ? (
        <AddRuleForm onDone={() => setAdding(false)} />
      ) : (!hasRules || allVisible) ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white"
        >
          + Regel toevoegen
        </button>
      ) : null}
    </section>
  )
}
