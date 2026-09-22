export type ConvictionUILevel = 'low' | 'medium' | 'high'

interface ConvictionUIOption {
  value: ConvictionUILevel
  label: string
  // Canonical numeric score this UI level writes to companies.conviction.
  score: number
}

// The edit flow only offers three buttons, so every value written through it
// is one of these three canonical scores — 1/3/5 double as the midpoints of
// the buckets convictionLabel() reads back.
export const CONVICTION_UI_LEVELS: ConvictionUIOption[] = [
  { value: 'low', label: 'Laag', score: 1 },
  { value: 'medium', label: 'Gemiddeld', score: 3 },
  { value: 'high', label: 'Hoog', score: 5 },
]

export function convictionLabel(conviction: number | null): string {
  if (conviction === null) return 'Nog niet bepaald'
  if (conviction <= 2) return 'Laag'
  if (conviction === 3) return 'Gemiddeld'
  return 'Hoog'
}

export function convictionUILevel(conviction: number | null): ConvictionUILevel {
  if (conviction === null || conviction <= 2) return 'low'
  if (conviction === 3) return 'medium'
  return 'high'
}

export function convictionChangeTitle(from: number | null, to: number | null) {
  const fromLabel = convictionLabel(from)
  const toLabel = convictionLabel(to)
  const direction = to !== null && from !== null && to > from ? 'verhoogd' : 'verlaagd'
  return `Overtuiging ${direction} — ${fromLabel} → ${toLabel}`
}
