'use client'

import { useState } from 'react'

const SIZE_CLASSES = {
  md: { box: 'h-9 w-9', text: 'text-xs' },
  lg: { box: 'h-14 w-14', text: 'text-base' },
} as const

const VARIANT_CLASSES = {
  // Homepage list rows: neutral, low-key.
  muted: 'bg-slate-100 text-slate-400',
  // Company page header: the one place a logo is a focal point.
  accent: 'border-2 border-slate-200 bg-blue-600 text-white',
} as const

export function CompanyLogo({
  logoUrl,
  ticker,
  size = 'md',
  variant = 'muted',
}: {
  logoUrl: string | null
  ticker: string
  size?: keyof typeof SIZE_CLASSES
  variant?: keyof typeof VARIANT_CLASSES
}) {
  const { box, text } = SIZE_CLASSES[size]
  // logo_url is a best-effort, unofficial lookup (lib/logos/clearbit.ts) —
  // the URL itself can 404 or the image can otherwise fail to load, and
  // that must fall back to initials rather than show a broken-image icon.
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full ${VARIANT_CLASSES[variant]}`}
    >
      {logoUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external logo host, not worth configuring next/image for
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`${text} font-medium`}>{ticker.slice(0, 2)}</span>
      )}
    </div>
  )
}
