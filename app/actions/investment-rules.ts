'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type CreateInvestmentRuleResult = { success: true } | { success: false; error: string }

export async function createInvestmentRule(content: string): Promise<CreateInvestmentRuleResult> {
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

  const trimmed = content.trim()
  if (!trimmed) {
    return { success: false, error: 'Schrijf de regel op voordat je opslaat.' }
  }

  const { error } = await supabase
    .from('investment_rules')
    .insert({ user_id: user.id, content: trimmed })
  if (error) {
    return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
  }

  revalidatePath('/lessen')
  return { success: true }
}
