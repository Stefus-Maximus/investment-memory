'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { CompanyStatus } from '@/lib/supabase/database.types'

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

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ user_id: user.id, name, ticker, exchange, status: input.status })
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
