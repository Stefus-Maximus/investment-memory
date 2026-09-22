'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

interface UpsertThesisInput {
  companyId: string
  thesisText: string
  invalidationText: string
}

type UpsertThesisResult = { success: true } | { success: false; error: string }

export async function upsertThesis(input: UpsertThesisInput): Promise<UpsertThesisResult> {
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

  // Re-derive ownership from the session rather than trusting the caller —
  // a well-formed companyId could belong to someone else's row.
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', input.companyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (companyError || !company) {
    return { success: false, error: 'Bedrijf niet gevonden.' }
  }

  const thesisText = input.thesisText.trim()
  const invalidationText = input.invalidationText.trim()

  const { error: upsertError } = await supabase.from('thesis').upsert(
    {
      company_id: company.id,
      user_id: user.id,
      thesis_text: thesisText || null,
      invalidation_text: invalidationText || null,
    },
    { onConflict: 'company_id' }
  )

  if (upsertError) {
    return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
  }

  revalidatePath(`/companies/${company.id}`)
  return { success: true }
}
