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

const rangeDayFormatter = new Intl.DateTimeFormat('nl-NL', { day: 'numeric' })
const rangeDayMonthFormatter = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' })

// "Deze week"'s subtext (§ nieuws-spec): the last 7 days, ending today.
export function formatWeekRange(): string {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 6)

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const startLabel = sameMonth ? rangeDayFormatter.format(start) : rangeDayMonthFormatter.format(start)
  return `${startLabel} – ${rangeDayMonthFormatter.format(end)}`
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
