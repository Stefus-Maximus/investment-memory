// Server-only, key-free best-effort logo lookup for a newly added company.
// Three unofficial sources chained together — all undocumented and all
// swappable independently, so each step fails soft into the next:
//
// 1. Clearbit's autocomplete endpoint resolves a company name to a domain.
//    It used to also return a ready-made logo URL in the same response, but
//    that `logo` field is dead (Clearbit shut down its free Logo API after
//    the 2023 HubSpot acquisition — it now always comes back null). Only
//    the name → domain resolution still works, so that's all this uses it
//    for. Its fuzzy name search also chokes on legal-entity suffixes — e.g.
//    "NVIDIA Corporation" (the exact string §15's search flow passes in,
//    straight from Yahoo's longname) matches nothing, and "Apple Inc."
//    matches three unrelated companies before ever reaching apple.com — so
//    stripLegalSuffix() below tries the bare brand name first.
// 2. Google's favicon service turns that domain into an actual image. When
//    it has nothing for a domain it doesn't fail cleanly — it serves a
//    generic globe placeholder image with a 404 status, so a plain
//    "did the request succeed" check isn't enough; isRealImage() below
//    checks the actual status.
// 3. DuckDuckGo's icon proxy is tried next if Google came up empty. It has
//    its own different "nothing here" shape (200 OK with an empty
//    text/plain body instead of a 404), which isRealImage() also covers by
//    requiring an image/* content-type.
//
// This is a best-effort lookup only: a company's logo_url is allowed to
// stay null forever, and CompanyLogo already falls back to a
// coloured-initials circle whenever logoUrl is null or the image itself
// fails to load. Callers must never let a failure here block or fail
// company creation.
const CLEARBIT_AUTOCOMPLETE_URL = 'https://autocomplete.clearbit.com/v1/companies/suggest'
const GOOGLE_FAVICON_URL = 'https://www.google.com/s2/favicons'
const DUCKDUCKGO_ICON_URL = 'https://icons.duckduckgo.com/ip3'
const FAVICON_SIZE = 128

// Bounds the worst case (a hanging or slow third party) per request, so a
// single stalled source can't make "add company" hang indefinitely. Up to
// three requests happen in sequence (domain lookup, then up to two image
// checks), so the true worst case is a multiple of this, not a hard cap.
const REQUEST_TIMEOUT_MS = 2000

interface ClearbitSuggestion {
  name: string
  domain: string
  logo: string | null
}

// Strips trailing legal-entity suffixes ("Inc.", "Corporation", "plc",
// "N.V.", "Holding", "Group", ...) one at a time, since a listed company's
// full legal name often stacks more than one (e.g. "ASML Holding N.V." or
// "Wise Group plc"). Pure string manipulation, no network call — the result
// is tried against Clearbit before the untouched name (see module comment).
const LEGAL_SUFFIX_RE =
  /[,.]?\s+(inc|incorporated|corp|corporation|co|company|ltd|limited|plc|llc|llp|gmbh|kgaa|ag|se|sa|s\.a|nv|n\.v|asa|ab|a\/s|oyj|holding|holdings|group|groep)\.?$/i

function stripLegalSuffix(name: string): string {
  let result = name.trim()
  let stripped = result.replace(LEGAL_SUFFIX_RE, '').trim()
  while (stripped && stripped !== result) {
    result = stripped
    stripped = result.replace(LEGAL_SUFFIX_RE, '').trim()
  }
  return result
}

async function resolveDomain(companyName: string): Promise<string | null> {
  const url = new URL(CLEARBIT_AUTOCOMPLETE_URL)
  url.searchParams.set('query', companyName)

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 86400 }, // a company's domain essentially never changes
    })
    if (!response.ok) return null

    const suggestions = (await response.json()) as ClearbitSuggestion[]
    return suggestions[0]?.domain ?? null
  } catch {
    return null
  }
}

function buildGoogleFaviconUrl(domain: string): string {
  const url = new URL(GOOGLE_FAVICON_URL)
  url.searchParams.set('domain', domain)
  url.searchParams.set('sz', String(FAVICON_SIZE))
  return url.toString()
}

function buildDuckDuckGoIconUrl(domain: string): string {
  return `${DUCKDUCKGO_ICON_URL}/${domain}.ico`
}

// Confirms a candidate URL actually serves an image, rather than one of the
// two "nothing found" shapes described above. A GET (not HEAD) is needed
// here — Google's redirect target doesn't answer HEAD requests reliably.
async function isRealImage(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!response.ok) return false
    return (response.headers.get('content-type') ?? '').startsWith('image/')
  } catch {
    return false
  }
}

export async function getCompanyLogoUrl(companyName: string): Promise<string | null> {
  const query = companyName.trim()
  if (!query) return null

  const stripped = stripLegalSuffix(query)
  const domain =
    (stripped !== query ? await resolveDomain(stripped) : null) ?? (await resolveDomain(query))
  if (!domain) return null

  const googleUrl = buildGoogleFaviconUrl(domain)
  if (await isRealImage(googleUrl)) return googleUrl

  const duckduckgoUrl = buildDuckDuckGoIconUrl(domain)
  if (await isRealImage(duckduckgoUrl)) return duckduckgoUrl

  return null
}
