'use server'

import { revalidatePath } from 'next/cache'

import { CONVICTION_UI_LEVELS, convictionLabel, type ConvictionUILevel } from '@/lib/conviction'
import { getCurrentPrice } from '@/lib/market-data/yahoo-finance'
import { createClient } from '@/lib/supabase/server'

interface UpdateConvictionInput {
  companyId: string
  level: ConvictionUILevel
  reason: string
}

type UpdateConvictionResult = { success: true } | { success: false; error: string }

export async function updateConviction(
  input: UpdateConvictionInput
): Promise<UpdateConvictionResult> {
  const option = CONVICTION_UI_LEVELS.find((o) => o.value === input.level)
  if (!option) {
    return { success: false, error: 'Ongeldig niveau.' }
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

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, conviction, ticker, exchange')
    .eq('id', input.companyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (companyError || !company) {
    return { success: false, error: 'Bedrijf niet gevonden.' }
  }

  const previousConviction = company.conviction

  const { error: updateError } = await supabase
    .from('companies')
    .update({ conviction: option.score })
    .eq('id', company.id)

  if (updateError) {
    return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
  }

  // A conviction_change moment needs a real "from" state (the DB requires
  // both conviction_from and conviction_to), and only means something when
  // the visible tier actually moved — so skip it on the very first set, and
  // when the edit just re-confirms the same tier.
  const wasUnset = previousConviction === null
  const tierUnchanged = !wasUnset && convictionLabel(previousConviction) === option.label

  if (!wasUnset && !tierUnchanged) {
    const reason = input.reason.trim()
    // §33-34: a conviction change gets the same frozen price snapshot as a
    // note — the timeline should be able to show "koers op dat moment" for
    // this entry too, not just for free-text notes.
    const quote = await getCurrentPrice(company.ticker, company.exchange)
    const { error: momentError } = await supabase.from('moments').insert({
      company_id: company.id,
      user_id: user.id,
      type: 'conviction_change',
      content: reason || null,
      conviction_from: previousConviction,
      conviction_to: option.score,
      price_at_time: quote?.price ?? null,
      price_currency: quote?.currency ?? null,
    })

    if (momentError) {
      return {
        success: false,
        error: 'Overtuiging opgeslagen, maar het moment kon niet worden vastgelegd.',
      }
    }
  }

  revalidatePath(`/companies/${company.id}`)
  return { success: true }
}
