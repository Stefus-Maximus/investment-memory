// Server-only. Yahoo Finance's chart endpoint needs no API key, but this
// module is still the app's one point of contact with a market-data
// provider: every Yahoo-specific detail — the symbol-suffix mapping, the
// response shape, the pence/pound quirk below, the User-Agent requirement —
// lives only here. Swapping providers again (this replaced Twelve Data,
// which replaced an earlier Stooq attempt that turned out to be blocked)
// means writing a new module with this same exported signature and
// repointing the one import in the company page; nothing else in the app
// should talk to a market-data provider directly.
const YAHOO_CHART_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

// A request with no User-Agent gets rate-limited (verified: 429 without one,
// 200 with one) — Yahoo's endpoint is undocumented, so this is the simplest
// thing that reliably works, not a documented requirement.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

// Same ticker-ambiguity problem §15 solves for search, and the same
// exchanges twelve-data.ts disambiguates via mic_code — here as the Yahoo
// symbol suffix instead. US listings take no suffix. Verified against
// Yahoo's chart endpoint for each exchange known-companies.ts currently
// uses.
const EXCHANGE_YAHOO_SUFFIXES: Record<string, string> = {
  'Euronext Amsterdam': '.AS',
  'Euronext Paris': '.PA',
  XETRA: '.DE',
  'London Stock Exchange': '.L',
  NASDAQ: '',
  NYSE: '',
}

export interface DailyPricePoint {
  date: string
  close: number
}

export interface CurrentPrice {
  price: number
  currency: string
}

interface YahooChartResult {
  meta: { currency?: string; regularMarketPrice?: number }
  timestamp?: number[]
  indicators: { quote: { close: (number | null)[] }[] }
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null
  }
}

function resolveSymbol(ticker: string, exchange: string): string {
  const suffix = EXCHANGE_YAHOO_SUFFIXES[exchange] ?? ''
  return `${ticker}${suffix}`
}

// Yahoo reports London-listed instruments in pence under the currency code
// "GBp" (lowercase p — Yahoo's own code, not the ISO 4217 "GBX"). Applied to
// every raw Yahoo price before it leaves this module — both the current
// price and the daily series — so a value never leaks out 100x too large.
// Left unhandled, this also crashes formatPrice()'s Intl.NumberFormat,
// which doesn't recognise "GBp" as a valid currency at all. Keep this
// wherever GBp-handling is touched — it's easy to assume the raw Yahoo
// number is already correct and delete it by accident.
const GBP_PENCE_CODE = 'GBp'

function isPenceQuoted(currency: string | undefined): boolean {
  return currency === GBP_PENCE_CODE
}

async function fetchChart(
  symbol: string,
  range: string,
  revalidateSeconds: number
): Promise<YahooChartResult | null> {
  const url = new URL(`${YAHOO_CHART_BASE_URL}/${symbol}`)
  url.searchParams.set('range', range)
  url.searchParams.set('interval', '1d')

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      // Same caching layer as the Twelve Data module: Next.js's fetch cache,
      // at the same cadence per call site below. This is what keeps a
      // wandering user from re-fetching on every page load and running into
      // Yahoo's (undocumented, but real — see the 429 above) rate limiting.
      next: { revalidate: revalidateSeconds },
    })
    // Covers both unknown symbols and any other non-2xx — Yahoo returns a
    // 404 with a JSON error body for delisted/unknown tickers. Either way
    // there's nothing usable, so callers fall back to their own placeholder.
    if (!response.ok) return null

    const data = (await response.json()) as YahooChartResponse
    return data.chart.result?.[0] ?? null
  } catch {
    return null
  }
}

// Small and quiet in the company header (§20) — active source as of the
// Twelve Data → Yahoo switch.
export async function getCurrentPrice(
  ticker: string,
  exchange: string
): Promise<CurrentPrice | null> {
  const result = await fetchChart(
    resolveSymbol(ticker, exchange),
    '5d',
    900 // 15 min — same cadence as the Twelve Data module; this app is
    // deliberately not about watching prices live
  )

  const price = result?.meta.regularMarketPrice
  const currency = result?.meta.currency
  if (price === undefined || !currency) return null

  return isPenceQuoted(currency) ? { price: price / 100, currency: 'GBP' } : { price, currency }
}

// Yahoo's range parameter is a coarse bucket (1y, 2y, 5y, ...) rather than
// an exact bar count like Twelve Data's outputsize, so this rounds up to
// the smallest bucket that should comfortably cover `outputsize` trading
// days (~252/year); the caller then trims to the exact count.
function rangeCoveringOutputsize(outputsize: number): string {
  const years = Math.ceil(outputsize / 252)
  if (years <= 1) return '1y'
  if (years <= 2) return '2y'
  if (years <= 5) return '5y'
  if (years <= 10) return '10y'
  return 'max'
}

// Daily bars, oldest first, enough for a multi-year chart (§26). Built and
// verified (10y range ≈ 2500 daily bars for a US-listed symbol), but not
// called from any page yet — the visual chart is the next step.
export async function getDailyPrices(
  ticker: string,
  exchange: string,
  outputsize = 1500
): Promise<DailyPricePoint[] | null> {
  const result = await fetchChart(
    resolveSymbol(ticker, exchange),
    rangeCoveringOutputsize(outputsize),
    86400 // once a day — same cadence as the Twelve Data module; only
    // "today"'s bar can meaningfully change intraday
  )

  const timestamps = result?.timestamp
  const closes = result?.indicators.quote[0]?.close
  if (!timestamps || !closes) return null

  const pence = isPenceQuoted(result?.meta.currency)

  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((point): point is DailyPricePoint => Number.isFinite(point.close))
    .map((point) => (pence ? { ...point, close: point.close / 100 } : point))
    .slice(-outputsize) // Yahoo already returns oldest → newest, unlike
  // Twelve Data, which needed a reverse() here
}
