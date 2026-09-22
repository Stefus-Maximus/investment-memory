// Server-only. TWELVE_DATA_API_KEY has no NEXT_PUBLIC_ prefix, so it never
// reaches the client bundle — every call here must stay in server code
// (Server Components, Route Handlers, Server Actions).
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com'

// Twelve Data's `exchange` param is a shared brand name for some venues —
// every Euronext market reports as plain "Euronext" — so it can't
// disambiguate on its own; `mic_code` is the only reliable way to pick the
// right listing. Same ticker-ambiguity problem §15 solves for search, one
// level down. Verified against Twelve Data's /symbol_search for each of the
// exchanges known-companies.ts currently uses.
const EXCHANGE_MIC_CODES: Record<string, string> = {
  'Euronext Amsterdam': 'XAMS',
  'Euronext Paris': 'XPAR',
  XETRA: 'XETR',
  'London Stock Exchange': 'XLON',
  NASDAQ: 'XNGS',
  NYSE: 'XNYS',
}

export interface DailyPricePoint {
  date: string
  close: number
}

export interface CurrentPrice {
  price: number
  currency: string
}

interface TwelveDataQuoteResponse {
  close?: string
  currency?: string
}

interface TwelveDataTimeSeriesResponse {
  status?: string
  values?: { datetime: string; close: string }[]
}

function resolveParams(ticker: string, exchange: string): Record<string, string> {
  const micCode = EXCHANGE_MIC_CODES[exchange]
  return micCode ? { symbol: ticker, mic_code: micCode } : { symbol: ticker, exchange }
}

async function twelveDataGet<T>(
  path: string,
  params: Record<string, string>,
  revalidateSeconds: number
): Promise<T | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) return null

  const url = new URL(`${TWELVE_DATA_BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('apikey', apiKey)

  try {
    const response = await fetch(url, { next: { revalidate: revalidateSeconds } })
    // Twelve Data returns a non-2xx status for both invalid symbols and
    // plan-tier-restricted ones (e.g. free-tier keys can't reach most
    // non-US exchanges) — either way there's nothing usable to show, so
    // every caller falls back to its own "not available" placeholder
    // rather than surfacing an error.
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

// Small and quiet in the company header (§20) — independent of the daily
// history below, which isn't wired into any page yet.
export async function getCurrentPrice(
  ticker: string,
  exchange: string
): Promise<CurrentPrice | null> {
  const data = await twelveDataGet<TwelveDataQuoteResponse>(
    '/quote',
    resolveParams(ticker, exchange),
    900 // 15 min — this app is deliberately not about watching prices live
  )

  if (!data?.close || !data.currency) return null
  const price = Number(data.close)
  if (!Number.isFinite(price)) return null

  return { price, currency: data.currency }
}

// Daily bars, oldest first, enough for a multi-year chart (§26). Built and
// verified (1500 bars ≈ 6 years for a US-listed symbol on the free tier),
// but not called from any page yet — the visual chart is the next step.
export async function getDailyPrices(
  ticker: string,
  exchange: string,
  outputsize = 1500
): Promise<DailyPricePoint[] | null> {
  const data = await twelveDataGet<TwelveDataTimeSeriesResponse>(
    '/time_series',
    { ...resolveParams(ticker, exchange), interval: '1day', outputsize: String(outputsize) },
    86400 // once a day — only "today"'s bar can meaningfully change intraday
  )

  if (!data?.values || data.status === 'error') return null

  return data.values
    .map((point) => ({ date: point.datetime, close: Number(point.close) }))
    .filter((point) => Number.isFinite(point.close))
    .reverse() // Twelve Data returns most-recent-first; charts read oldest → newest
}
