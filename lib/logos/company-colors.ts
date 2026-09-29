// Deterministic colour assignment for the company-initials fallback in
// CompanyLogo. The domain/favicon lookup this used to pick from (Clearbit +
// Google + DuckDuckGo) turned out unreliable for too many companies — wrong
// or missing logos — so CompanyLogo now shows coloured initials for every
// company, always. A hash of the ticker (stable per company, shared across
// users following the same one) picks a colour from a small fixed palette,
// so the same company always gets the same colour rather than a random one
// per render. Same muted, editorial tones as the onboarding avatar palette
// (lib/avatars.ts) — never bright green/orange/red, which stay reserved for
// their narrow meanings elsewhere in the app (§4.2).
const COMPANY_COLORS = [
  '#5B7FA6', // dusty blue
  '#A68A6D', // taupe
  '#7C8B6F', // sage
  '#4B4B4E', // charcoal
  '#B08268', // clay
  '#8B94A3', // slate
  '#7A6C8B', // plum
  '#BFA05A', // sand
  '#6B8F87', // teal-grey
  '#9A6B6B', // brick
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getCompanyColor(key: string): string {
  return COMPANY_COLORS[hashString(key) % COMPANY_COLORS.length]
}
