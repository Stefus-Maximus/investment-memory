// Server-only. This module is the app's one point of contact with a news
// provider — same isolation principle as lib/market-data and lib/logos: a
// failing or empty response here must never break the rest of the app
// (callers get [] back, never a thrown error), and swapping providers later
// means writing a new module with this same exported signature.
//
// STAP 0 research (see conversation) tested Yahoo Finance's search endpoint,
// Finnhub company-news, and Marketaux against the app's own tickers (ASML,
// WKL, AAPL, NVDA). Finnhub and Marketaux both require a registered API key
// (verified: neither works unauthenticated). Yahoo's search endpoint needs
// no key and returns usable, on-topic news for both European and US names —
// the only candidate that covers both without a key — so it's the one used
// here, reusing the same undocumented endpoint lib/market-data/yahoo-finance.ts
// already talks to for company search.
const YAHOO_SEARCH_BASE_URL = 'https://query1.finance.yahoo.com/v1/finance/search'

// Same undocumented-but-required header as yahoo-finance.ts — a request
// without it gets rate-limited.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

// Verified during STAP 0: querying by the exchange-suffixed symbol (e.g.
// "ASML.AS") returns zero news results, but querying by the bare ticker or
// the full company name does return relevant results — for both exchanges.
// This module therefore queries by name, then filters the response by
// relatedTickers to keep only stories actually about this company.
// relatedTickers itself is inconsistent: a dual-listed name like ASML shows
// up bare ("ASML", its Nasdaq ADR symbol), while an Amsterdam-only listing
// like Wolters Kluwer shows up suffixed ("WKL.AS") — so a story is kept if
// either form matches.
const EXCHANGE_SUFFIXES: Record<string, string> = {
  'Euronext Amsterdam': '.AS',
  'Euronext Paris': '.PA',
  XETRA: '.DE',
  'London Stock Exchange': '.L',
  NASDAQ: '',
  NYSE: '',
}

// Verified by sampling actual Yahoo results for the app's own tickers (ASML,
// META, MSFT, TSLA, NVDA, SAP, LVMH, Heineken, Wolters Kluwer — see
// conversation for the raw output): a handful of syndicated, templated
// "content mill" publishers dominate the feed with auto-generated,
// formulaic headlines ("X Stock Drops 2.2% as...", "Is X Undervalued
// Following Y?", "X vs. Y: Which Stock Is the Better Buy?") — these are
// excluded outright rather than merely deprioritized. Titles from surviving
// publishers are never rewritten, only the set of publishers is filtered.
const EXCLUDED_PUBLISHERS = new Set([
  'gurufocus.com',
  'insider monkey',
  'simply wall st.',
  'simply wall st',
  'trefis',
  '24/7 wall st.',
  '24/7 wall st',
  'zacks',
])

// A positive list of established outlets and official company-disclosure
// wires (GlobeNewswire/Business Wire/PR Newswire carry the same buyback- and
// earnings-type releases a company's own IR page would show) — these sort
// first when present, never excluding anything else that isn't on the
// excluded list above.
const PREFERRED_PUBLISHERS = new Set([
  'reuters',
  'bloomberg',
  'cnbc',
  'financial times',
  'ft.com',
  'the wall street journal',
  'barrons.com',
  "barron's",
  'yahoo finance',
  'associated press',
  'ap news',
  'the guardian',
  "investor's business daily",
  'mt newswires',
  'globenewswire',
  'business wire',
  'pr newswire',
])

function normalizedPublisher(publisher: string): string {
  return publisher.trim().toLowerCase()
}

// Per-company override: query Yahoo by the bare ticker instead of the full
// company name. The default (querying by name) is deliberately kept for
// everyone else — a batch comparison across the app's own companies found
// it usually performs as well as or better than a ticker-only query
// (Wolters Kluwer, Heineken, LVMH and Randstad all return noticeably fewer
// on-topic, in-range results when queried by ticker alone), so this isn't
// a general default, only a documented exception per company that's been
// found to need it.
// - MELI (MercadoLibre, Inc.): querying "MercadoLibre, Inc." returns mostly
//   unrelated market noise (verified repeatedly: ~1 of 20 results actually
//   tagged with MELI); querying "MELI" directly returns on-topic, correctly
//   tagged results consistently (20 of 20, most within the last 7 days).
const QUERY_BY_TICKER = new Set(['MELI'])

// Manual alias table for companies where Yahoo's own relatedTickers tagging
// uses a different symbol than the ticker/exchange this app stores. Add a
// new entry here if the same mismatch turns up for another company — check
// by sampling that company's raw Yahoo search results the way WISE was
// diagnosed below (query by name, inspect the relatedTickers field on
// articles that are clearly about the right company).
const TICKER_ALIASES: Record<string, string[]> = {
  // Wise plc (fintech, London Stock Exchange) — this app stores ticker
  // "WISE", but Yahoo tags almost all of Wise's real news with "WSE"
  // instead, a separate symbol not derivable by stripping the exchange
  // suffix (unlike ASML's dual-listing case, where the alternate form is
  // just the same ticker without ".AS"). Verified: querying Yahoo for
  // "Wise Group plc" surfaces genuine Wise-the-fintech articles (e.g. "Wise
  // tumbles as US regulator rejects banking licence...") tagged with "WSE"
  // in 10 of 10 cases, versus "WISE"/"WISE.L" in only 2 of 10.
  WISE: ['WSE'],
}

export interface NewsArticle {
  title: string
  publisher: string
  url: string
  publishedAt: string // ISO
}

interface YahooNewsItem {
  title?: string
  publisher?: string
  link?: string
  providerPublishTime?: number
  relatedTickers?: string[]
}

interface YahooSearchResponse {
  news?: YahooNewsItem[]
}

function normalizedTitle(title: string): string {
  return title.trim().toLowerCase()
}

// Returns null only when the request itself failed (network error, non-2xx,
// unparseable body) — an empty array means the request succeeded but found
// nothing in range, which the news page treats as "no news this week for
// this company" rather than "the news source is broken".
export async function getCompanyNews(
  name: string,
  ticker: string,
  exchange: string,
  sinceDays = 7
): Promise<NewsArticle[] | null> {
  const suffix = EXCHANGE_SUFFIXES[exchange] ?? ''
  const aliases = TICKER_ALIASES[ticker] ?? []
  const acceptedTickers = new Set([ticker, `${ticker}${suffix}`, ...aliases])

  const url = new URL(YAHOO_SEARCH_BASE_URL)
  url.searchParams.set('q', QUERY_BY_TICKER.has(ticker) ? ticker : name)
  url.searchParams.set('quotesCount', '1')
  // Higher than strictly needed for 3 headlines: excluding content-mill
  // publishers below can remove a large share of what Yahoo returns (they
  // dominate the raw feed — see EXCLUDED_PUBLISHERS), so a wider pull gives
  // the filter enough left to still surface a few good ones.
  url.searchParams.set('newsCount', '20')

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 21600 }, // 6h — a weekly-cadence feature doesn't
      // need fresher, and this keeps a page with many followed companies
      // from hammering Yahoo's rate limit on every visit.
    })
    if (!response.ok) return null

    const data = (await response.json()) as YahooSearchResponse
    const cutoff = Date.now() / 1000 - sinceDays * 24 * 60 * 60

    const seenUrls = new Set<string>()
    const seenTitles = new Set<string>()
    const articles: NewsArticle[] = []

    for (const item of data.news ?? []) {
      if (!item.title || !item.link || !item.publisher || !item.providerPublishTime) continue
      if (item.providerPublishTime < cutoff) continue
      if (!item.relatedTickers?.some((t) => acceptedTickers.has(t))) continue
      if (EXCLUDED_PUBLISHERS.has(normalizedPublisher(item.publisher))) continue

      const titleKey = normalizedTitle(item.title)
      if (seenUrls.has(item.link) || seenTitles.has(titleKey)) continue
      seenUrls.add(item.link)
      seenTitles.add(titleKey)

      articles.push({
        title: item.title,
        publisher: item.publisher,
        url: item.link,
        publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
      })
    }

    // §"Verbeter de kwaliteit": preferred publishers first, newest first
    // within each tier — a priority ordering, not a second exclusion, so a
    // non-preferred-but-not-excluded outlet can still appear.
    return articles.sort((a, b) => {
      const aTier = PREFERRED_PUBLISHERS.has(normalizedPublisher(a.publisher)) ? 0 : 1
      const bTier = PREFERRED_PUBLISHERS.has(normalizedPublisher(b.publisher)) ? 0 : 1
      if (aTier !== bTier) return aTier - bTier
      return b.publishedAt.localeCompare(a.publishedAt)
    })
  } catch {
    return null
  }
}
