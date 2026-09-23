'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type CreateLessonResult = { success: true } | { success: false; error: string }

export async function createLesson(content: string): Promise<CreateLessonResult> {
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
    return { success: false, error: 'Schrijf op welke les je hieruit trekt.' }
  }

  const { error } = await supabase.from('lessons').insert({ user_id: user.id, content: trimmed })
  if (error) {
    return { success: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw.' }
  }

  revalidatePath('/lessen')
  revalidatePath('/')
  return { success: true }
}
