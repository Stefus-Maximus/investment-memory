'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentPrice } from '@/lib/market-data/yahoo-finance'
import { createClient } from '@/lib/supabase/server'

type CreateMomentResult = { success: true } | { success: false; error: string }

interface CreateNoteInput {
  companyId: string
  type: 'note'
  content: string
}

interface CreateSourceInput {
  companyId: string
  type: 'source'
  sourceUrl: string
  sourceTitle: string
  content?: string
}

type CreateMomentInput = CreateNoteInput | CreateSourceInput

export async function createMoment(input: CreateMomentInput): Promise<CreateMomentResult> {
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
    .select('id, ticker, exchange')
    .eq('id', input.companyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (companyError || !company) {
    return { success: false, error: 'Bedrijf niet gevonden.' }
  }

  if (input.type === 'note') {
    const content = input.content.trim()
    if (!content) {
      return { success: false, error: 'Schrijf op wat er door je hoofd gaat.' }
    }

    // §34: fetched once, frozen forever — a lookup failure (rate limit,
    // unknown symbol, provider hiccup) yields a null price rather than
    // blocking the save; the user's own words matter more than a fully
    // populated field (§1.4), and the timeline shows "€ —" for it.
    const quote = await getCurrentPrice(company.ticker, company.exchange)

    const { error: insertError } = await supabase.from('moments').insert({
      company_id: company.id,
      user_id: user.id,
      type: 'note',
      content,
      price_at_time: quote?.price ?? null,
      price_currency: quote?.currency ?? null,
    })

    if (insertError) {
      return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
    }
  } else {
    const sourceUrl = input.sourceUrl.trim()
    const sourceTitle = input.sourceTitle.trim()
    const content = (input.content ?? '').trim()

    if (!sourceUrl || !sourceTitle) {
      return { success: false, error: 'Vul een URL en titel in.' }
    }

    const { error: insertError } = await supabase.from('moments').insert({
      company_id: company.id,
      user_id: user.id,
      type: 'source',
      source_url: sourceUrl,
      source_title: sourceTitle,
      content: content || null,
    })

    if (insertError) {
      return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
    }
  }

  revalidatePath(`/companies/${company.id}`)
  return { success: true }
}
