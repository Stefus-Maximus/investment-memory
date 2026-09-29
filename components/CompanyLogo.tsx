import { getCompanyColor } from '@/lib/logos/company-colors'

const SIZE_CLASSES = {
  md: { box: 'h-9 w-9', text: 'text-xs' },
  lg: { box: 'h-14 w-14', text: 'text-base' },
} as const

const VARIANT_CLASSES = {
  // Homepage list rows: no extra emphasis.
  muted: '',
  // Company page header: the one place a logo is a focal point.
  accent: 'border-2 border-slate-200',
} as const

export function CompanyLogo({
  ticker,
  size = 'md',
  variant = 'muted',
}: {
  ticker: string
  size?: keyof typeof SIZE_CLASSES
  variant?: keyof typeof VARIANT_CLASSES
}) {
  const { box, text } = SIZE_CLASSES[size]

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full text-white ${text} font-medium ${VARIANT_CLASSES[variant]}`}
      style={{ backgroundColor: getCompanyColor(ticker) }}
    >
      {ticker.slice(0, 2)}
    </div>
  )
}
