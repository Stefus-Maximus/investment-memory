'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentPrice, getPriceForDate } from '@/lib/market-data/yahoo-finance'
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
  revalidatePath('/')
  return { success: true }
}

interface UpdateNoteInput {
  momentId: string
  type: 'note'
  content: string
  occurredAt: string
}

interface UpdateSourceInput {
  momentId: string
  type: 'source'
  sourceUrl: string
  sourceTitle: string
  content?: string
  occurredAt: string
}

type UpdateMomentInput = UpdateNoteInput | UpdateSourceInput

// Editable exactly for the two moment types the user writes themselves —
// conviction_change stays system-generated and is refused below even if a
// caller somehow points a momentId at one.
export async function updateMoment(input: UpdateMomentInput): Promise<CreateMomentResult> {
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
    .from('moments')
    .select('id, company_id, type, occurred_at')
    .eq('id', input.momentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError || !existing) {
    return { success: false, error: 'Moment niet gevonden.' }
  }

  if (existing.type !== input.type) {
    return { success: false, error: 'Dit moment kan niet worden bewerkt.' }
  }

  const occurredAtDate = new Date(`${input.occurredAt}T00:00:00Z`)
  if (Number.isNaN(occurredAtDate.getTime())) {
    return { success: false, error: 'Ongeldige datum.' }
  }

  const dateChanged = input.occurredAt !== existing.occurred_at.slice(0, 10)

  if (input.type === 'note') {
    const content = input.content.trim()
    if (!content) {
      return { success: false, error: 'Schrijf op wat er door je hoofd gaat.' }
    }

    const update: { content: string; occurred_at?: string; price_at_time?: number | null; price_currency?: string | null } = {
      content,
    }

    // §34: the snapshot only moves when the date itself moves — editing just
    // the text of a note must not quietly re-price it.
    if (dateChanged) {
      const { data: company } = await supabase
        .from('companies')
        .select('ticker, exchange')
        .eq('id', existing.company_id)
        .eq('user_id', user.id)
        .maybeSingle()

      update.occurred_at = occurredAtDate.toISOString()
      if (company) {
        const quote = await getPriceForDate(company.ticker, company.exchange, input.occurredAt)
        update.price_at_time = quote?.price ?? null
        update.price_currency = quote?.currency ?? null
      }
    }

    const { error: updateError } = await supabase.from('moments').update(update).eq('id', existing.id)
    if (updateError) {
      return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
    }
  } else {
    const sourceUrl = input.sourceUrl.trim()
    const sourceTitle = input.sourceTitle.trim()
    const content = (input.content ?? '').trim()

    if (!sourceUrl || !sourceTitle) {
      return { success: false, error: 'Vul een URL en titel in.' }
    }

    const update: { source_url: string; source_title: string; content: string | null; occurred_at?: string } = {
      source_url: sourceUrl,
      source_title: sourceTitle,
      content: content || null,
    }
    if (dateChanged) {
      update.occurred_at = occurredAtDate.toISOString()
    }

    const { error: updateError } = await supabase.from('moments').update(update).eq('id', existing.id)
    if (updateError) {
      return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
    }
  }

  revalidatePath(`/companies/${existing.company_id}`)
  return { success: true }
}

export async function deleteMoment(momentId: string): Promise<CreateMomentResult> {
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
    .from('moments')
    .select('id, company_id, type')
    .eq('id', momentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError || !existing) {
    return { success: false, error: 'Moment niet gevonden.' }
  }

  if (existing.type === 'conviction_change') {
    return { success: false, error: 'Dit moment kan niet worden verwijderd.' }
  }

  const { error: deleteError } = await supabase.from('moments').delete().eq('id', existing.id)
  if (deleteError) {
    return { success: false, error: 'Verwijderen is niet gelukt. Probeer het opnieuw.' }
  }

  revalidatePath(`/companies/${existing.company_id}`)
  return { success: true }
}
