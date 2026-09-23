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
const YAHOO_SEARCH_BASE_URL = 'https://query1.finance.yahoo.com/v1/finance/search'

// A request with no User-Agent gets rate-limited (verified: 429 without one,
// 200 with one) — Yahoo's endpoint is undocumented, so this is the simplest
// thing that reliably works, not a documented requirement.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

// Same ticker-ambiguity problem §15 solves for search, and the same
// exchanges twelve-data.ts disambiguates via mic_code — here as the Yahoo
// symbol suffix instead. US listings take no suffix. Verified against
// Yahoo's chart endpoint for each exchange known-companies.ts used to list.
//
// Single source of truth for both directions: resolveSymbol() below turns a
// stored (ticker, exchange) back into a Yahoo chart symbol via `suffix`;
// searchCompanies() turns a live search result's Yahoo exchange code back
// into the same (ticker, exchange) shape via `searchCodes`. A search result
// on an exchange not listed here is dropped rather than guessed — storing a
// ticker/exchange pair that resolveSymbol() can't turn back into a working
// Yahoo symbol would silently break that company's price lookups forever.
const SUPPORTED_EXCHANGES: { name: string; suffix: string; searchCodes: string[] }[] = [
  { name: 'Euronext Amsterdam', suffix: '.AS', searchCodes: ['AMS'] },
  { name: 'Euronext Paris', suffix: '.PA', searchCodes: ['PAR'] },
  { name: 'XETRA', suffix: '.DE', searchCodes: ['GER'] },
  { name: 'London Stock Exchange', suffix: '.L', searchCodes: ['LSE'] },
  { name: 'NASDAQ', suffix: '', searchCodes: ['NMS', 'NGM', 'NCM'] },
  { name: 'NYSE', suffix: '', searchCodes: ['NYQ'] },
]

const EXCHANGE_YAHOO_SUFFIXES: Record<string, string> = Object.fromEntries(
  SUPPORTED_EXCHANGES.map((exchange) => [exchange.name, exchange.suffix])
)

const SEARCH_CODE_TO_EXCHANGE = new Map(
  SUPPORTED_EXCHANGES.flatMap((exchange) =>
    exchange.searchCodes.map((code) => [code, exchange] as const)
  )
)

export interface DailyPricePoint {
  date: string
  close: number
}

export interface CurrentPrice {
  price: number
  currency: string
}

// §15's search result shape. quoteType is kept on the result rather than
// collapsed away — callers may want to label ETFs, even though the MVP
// search screen currently shows both kinds side by side, undistinguished.
export interface CompanySearchResult {
  name: string
  ticker: string
  exchange: string
  quoteType: 'EQUITY' | 'ETF'
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

interface YahooSearchQuote {
  symbol?: string
  shortname?: string
  longname?: string
  exchange?: string
  quoteType?: string
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[]
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

async function fetchChartWithParams(
  symbol: string,
  params: Record<string, string>,
  revalidateSeconds: number
): Promise<YahooChartResult | null> {
  const url = new URL(`${YAHOO_CHART_BASE_URL}/${symbol}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

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

function fetchChart(
  symbol: string,
  range: string,
  revalidateSeconds: number
): Promise<YahooChartResult | null> {
  return fetchChartWithParams(symbol, { range, interval: '1d' }, revalidateSeconds)
}

// §15's live replacement for known-companies.ts's static list. Returns null
// only when the request itself failed (network error, non-2xx, unparseable
// body) — never for a query that legitimately matched nothing — so callers
// can tell "search is broken" apart from "no results" and word the empty
// state accordingly.
export async function searchCompanies(query: string): Promise<CompanySearchResult[] | null> {
  const q = query.trim()
  if (!q) return []

  const url = new URL(YAHOO_SEARCH_BASE_URL)
  url.searchParams.set('q', q)
  url.searchParams.set('quotesCount', '10')
  url.searchParams.set('newsCount', '0')

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 300 }, // 5 min — this is typed-search traffic, not
      // a price; a short cache just softens repeat/duplicate queries during
      // one typing session.
    })
    if (!response.ok) return null

    const data = (await response.json()) as YahooSearchResponse
    const results: CompanySearchResult[] = []

    for (const quote of data.quotes ?? []) {
      if (quote.quoteType !== 'EQUITY' && quote.quoteType !== 'ETF') continue
      if (!quote.symbol || !quote.exchange) continue

      const exchange = SEARCH_CODE_TO_EXCHANGE.get(quote.exchange)
      if (!exchange) continue // unsupported exchange — see SUPPORTED_EXCHANGES above

      const ticker =
        exchange.suffix && quote.symbol.endsWith(exchange.suffix)
          ? quote.symbol.slice(0, -exchange.suffix.length)
          : quote.symbol

      results.push({
        name: quote.longname ?? quote.shortname ?? ticker,
        ticker,
        exchange: exchange.name,
        quoteType: quote.quoteType,
      })
    }

    return results
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
// days (~252/year); the caller then trims to the exact count. Always called
// with the same (large, capped) outputsize regardless of a company's follow
// duration — the "1M"/"3M"/"1J"/"Alle" chart ranges are a client-side
// filter over one full fetch, not separate fetches, so this always requests
// enough history to cover all of them (§29's range-button bug: scoping the
// fetch itself to the default view starved the wider range buttons).
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

// Used when a moment's date is edited by hand (§34's "frozen forever" is
// about never *recomputing* a snapshot on its original date — this is the
// one deliberate exception: the user is choosing a different date, so the
// snapshot must move with it). period1/period2 bound a window ending the day
// after the target date, wide enough to jump back over a long weekend or a
// multi-day holiday to the last real trading day.
export async function getPriceForDate(
  ticker: string,
  exchange: string,
  dateIso: string
): Promise<CurrentPrice | null> {
  const target = new Date(`${dateIso}T00:00:00Z`)
  if (Number.isNaN(target.getTime())) return null

  const period1 = Math.floor(target.getTime() / 1000) - 12 * 24 * 60 * 60
  const period2 = Math.floor(target.getTime() / 1000) + 24 * 60 * 60

  const result = await fetchChartWithParams(
    resolveSymbol(ticker, exchange),
    { period1: String(period1), period2: String(period2), interval: '1d' },
    3600 // a historical lookup doesn't need to be as fresh as "today"
  )

  const timestamps = result?.timestamp
  const closes = result?.indicators.quote[0]?.close
  const currency = result?.meta.currency
  if (!timestamps || !closes || !currency) return null

  const points = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((point): point is DailyPricePoint => Number.isFinite(point.close))

  // The last close on or before the target date (price "as of" that day);
  // if the target predates the series entirely (e.g. before listing), fall
  // back to the first close after it rather than returning nothing.
  const point =
    [...points].reverse().find((p) => p.date <= dateIso) ?? points.find((p) => p.date > dateIso)
  if (!point) return null

  return isPenceQuoted(currency) ? { price: point.close / 100, currency: 'GBP' } : { price: point.close, currency }
}
