'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getCompanyLogoUrl } from '@/lib/logos/company-logo'
import { searchCompanies, type CompanySearchResult } from '@/lib/market-data/yahoo-finance'
import { createClient } from '@/lib/supabase/server'
import type { CompanyStatus } from '@/lib/supabase/database.types'

type SearchCompaniesResult =
  | { success: true; results: CompanySearchResult[] }
  | { success: false; error: string }

// §15's search screen calls this (not searchCompanies() directly) because
// that module is server-only and the search screen is a client component —
// same client/server split as createCompany() below.
export async function searchCompaniesAction(query: string): Promise<SearchCompaniesResult> {
  const results = await searchCompanies(query)
  if (results === null) {
    return { success: false, error: 'Zoeken lukt nu niet, probeer het straks opnieuw.' }
  }
  return { success: true, results }
}

interface CreateCompanyInput {
  name: string
  ticker: string
  exchange: string
  status: CompanyStatus
  thesisText: string
}

type CreateCompanyResult = { success: true } | { success: false; error: string }

const statusLabel: Record<CompanyStatus, string> = {
  portfolio: 'portfolio',
  watchlist: 'watchlist',
}

export async function createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
  const name = input.name.trim()
  const ticker = input.ticker.trim()
  const exchange = input.exchange.trim()
  const thesisText = input.thesisText.trim()

  if (!name || !ticker || !exchange) {
    return { success: false, error: 'Kies een bedrijf uit de zoekresultaten.' }
  }
  if (input.status !== 'portfolio' && input.status !== 'watchlist') {
    return { success: false, error: 'Ongeldige status.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'Geen sessie gevonden. Herlaad de pagina en probeer het opnieuw.',
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('companies')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .eq('exchange', exchange)
    .maybeSingle()

  if (existingError) {
    return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
  }

  // Already tracked: moving watchlist → portfolio (or vice versa) updates the
  // existing row in place — it must not create a second company (§16).
  if (existing) {
    if (existing.status === input.status) {
      return {
        success: false,
        error: `Dit bedrijf staat al in je ${statusLabel[input.status]}.`,
      }
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({ status: input.status })
      .eq('id', existing.id)

    if (updateError) {
      return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
    }

    revalidatePath('/')
    return { success: true }
  }

  // Best-effort only (see lib/logos/company-logo.ts) — never blocks or fails
  // creation below; a lookup that fails or finds nothing just leaves
  // logo_url null, and CompanyLogo falls back to initials.
  const logoUrl = await getCompanyLogoUrl(name)

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ user_id: user.id, name, ticker, exchange, status: input.status, logo_url: logoUrl })
    .select('id')
    .single()

  if (companyError) {
    if (companyError.code === '23505') {
      return {
        success: false,
        error: `Dit bedrijf staat al in je ${statusLabel[input.status]}.`,
      }
    }
    return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
  }

  if (thesisText) {
    const { error: thesisError } = await supabase
      .from('thesis')
      .insert({ company_id: company.id, user_id: user.id, thesis_text: thesisText })

    if (thesisError) {
      revalidatePath('/')
      return {
        success: false,
        error: 'Bedrijf is opgeslagen, maar de these kon niet worden opgeslagen.',
      }
    }
  }

  revalidatePath('/')
  return { success: true }
}

// Cascades onto thesis and moments (on delete cascade, §0001 migration) — one
// confirmation covers the whole history, since there's no way to keep a
// company's momenten without the company itself.
export async function deleteCompany(companyId: string): Promise<CreateCompanyResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'Geen sessie gevonden. Herlaad de pagina en probeer het opnieuw.',
    }
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (companyError || !company) {
    return { success: false, error: 'Bedrijf niet gevonden.' }
  }

  const { error: deleteError } = await supabase.from('companies').delete().eq('id', company.id)
  if (deleteError) {
    return { success: false, error: 'Verwijderen is niet gelukt. Probeer het opnieuw.' }
  }

  revalidatePath('/')
  redirect('/')
}
