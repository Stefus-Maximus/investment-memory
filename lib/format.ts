const shortDateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
})

export function formatShortDate(iso: string) {
  return shortDateFormatter.format(new Date(iso))
}

const timelineDateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatTimelineDate(iso: string) {
  return timelineDateFormatter.format(new Date(iso)).toUpperCase()
}

export function formatLongDate(iso: string) {
  return timelineDateFormatter.format(new Date(iso))
}

export function formatPrice(value: number, currency: string | null) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency ?? 'EUR',
  }).format(value)
}

// Rounded, no decimals — used for the chart's y-axis ticks, where the full
// formatPrice() precision would crowd a ~180-240px-tall chart.
export function formatPriceCompact(value: number, currency: string | null) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency ?? 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}
