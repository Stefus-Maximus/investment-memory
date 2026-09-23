import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CompanyLogo } from '@/components/CompanyLogo'
import { AuthGate } from '@/components/auth/AuthGate'
import { AddMomentFab } from '@/components/company/AddMomentFab'
import { CompanyOptionsMenu } from '@/components/company/CompanyOptionsMenu'
import { ConvictionLevel } from '@/components/company/ConvictionLevel'
import { MomentsSection } from '@/components/company/MomentsSection'
import { ThesisSection } from '@/components/company/ThesisSection'
import { buildPriceChartData, defaultRangeForFollowDuration } from '@/lib/chart-data'
import { formatPrice } from '@/lib/format'
import { getCurrentPrice, getDailyPrices } from '@/lib/market-data/yahoo-finance'
import { createClient } from '@/lib/supabase/server'

export default async function CompanyPage({ params, searchParams }: PageProps<'/companies/[id]'>) {
  const { id } = await params
  const { moment: momentParam } = await searchParams
  const initialSelectedMomentId = typeof momentParam === 'string' ? momentParam : null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  // No real account linked yet: block the rest of the app until one is.
  if (user.is_anonymous) return <AuthGate />

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, ticker, exchange, logo_url, conviction, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!company) notFound()

  const { data: thesis } = await supabase
    .from('thesis')
    .select('thesis_text, invalidation_text')
    .eq('company_id', company.id)
    .maybeSingle()

  const { data: moments } = await supabase
    .from('moments')
    .select(
      'id, type, content, price_at_time, price_currency, source_url, source_title, conviction_from, conviction_to, occurred_at'
    )
    .eq('company_id', company.id)
    .order('occurred_at', { ascending: false })

  const currentPrice = await getCurrentPrice(company.ticker, company.exchange)
  const dailyPrices = await getDailyPrices(company.ticker, company.exchange)

  const chartMoments = (moments ?? [])
    .filter((moment) => moment.type !== 'source' && moment.price_at_time != null)
    .map((moment) => ({
      id: moment.id,
      occurredAt: moment.occurred_at,
      price: moment.price_at_time!,
      currency: moment.price_currency,
      kind: moment.type as 'note' | 'conviction_change',
    }))

  const chartData = dailyPrices ? buildPriceChartData(dailyPrices, chartMoments) : null
  const defaultRange = defaultRangeForFollowDuration(company.created_at)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 bg-white px-4 pb-28 pt-6 text-slate-900">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/"
            aria-label="Terug"
            className="-ml-1.5 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12.5 4 7 10l5.5 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <CompanyLogo logoUrl={company.logo_url} ticker={company.ticker} size="lg" variant="accent" />

          <div className="min-w-0 pt-0.5">
            <p className="truncate text-lg font-semibold text-slate-900">{company.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {company.ticker} · {company.exchange}
            </p>
            <p
              className="mt-1 text-xs text-slate-400"
              title={currentPrice ? undefined : 'Koers nog niet beschikbaar'}
            >
              {currentPrice ? formatPrice(currentPrice.price, currentPrice.currency) : '€ —'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-1">
          <ConvictionLevel companyId={company.id} conviction={company.conviction} />
          <CompanyOptionsMenu companyId={company.id} companyName={company.name} />
        </div>
      </header>

      <ThesisSection
        companyId={company.id}
        thesisText={thesis?.thesis_text ?? ''}
        invalidationText={thesis?.invalidation_text ?? ''}
      />

      <MomentsSection
        moments={moments ?? []}
        chartData={chartData && chartData.length >= 2 ? chartData : null}
        currency={currentPrice?.currency ?? 'EUR'}
        defaultRange={defaultRange}
        initialSelectedMomentId={initialSelectedMomentId}
      />

      <AddMomentFab companyId={company.id} />
    </main>
  )
}
