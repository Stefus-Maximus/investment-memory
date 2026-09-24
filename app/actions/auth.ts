'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type AuthActionResult = { success: true } | { success: false; error: string }

function isEmailTakenError(error: { code?: string; message: string }) {
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return true
  return /already\s+(been\s+)?registered|already exists/i.test(error.message)
}

// §8: magic link, no password. Every visitor already carries an anonymous
// session (see lib/supabase/proxy.ts), so the default path here is Supabase's
// documented way to convert that session into a real account: updateUser()
// with an email keeps the same auth.uid(), which means every company/thesis/
// moment already written under it stays attached once the link is confirmed.
export async function requestMagicLink(email: string): Promise<AuthActionResult> {
  const trimmed = email.trim()
  if (!trimmed) return { success: false, error: 'Vul een e-mailadres in.' }

  const supabase = await createClient()
  const origin = (await headers()).get('origin')
  const emailRedirectTo = origin ? `${origin}/auth/confirm` : undefined

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({ email: trimmed }, { emailRedirectTo })
    if (!error) return { success: true }

    if (!isEmailTakenError(error)) {
      return { success: false, error: 'Versturen is niet gelukt. Probeer het opnieuw.' }
    }
    // The email already belongs to an existing real account — fall through
    // to a normal magic-link sign-in for that account. The current
    // anonymous session's data can't come along: it was never written
    // under that account's uid.
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo },
  })

  if (error) return { success: false, error: 'Versturen is niet gelukt. Probeer het opnieuw.' }
  return { success: true }
}

// One-time welcome screen (app/page.tsx / WelcomeIntro), gated on this flag
// so it survives across devices and never reappears after the first visit —
// user_metadata rather than a new table, since there's nothing else that
// needs a profiles row yet. Also captures the display name and avatar chosen
// on that same screen, stored alongside the flag.
export async function completeOnboarding(
  displayName: string,
  avatarId: string
): Promise<AuthActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: {
      onboarding_seen: true,
      display_name: displayName.trim(),
      avatar_id: avatarId,
    },
  })
  if (error) return { success: false, error: 'Dat ging niet goed. Probeer het opnieuw.' }

  revalidatePath('/')
  return { success: true }
}

export async function signOut(): Promise<AuthActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) return { success: false, error: 'Uitloggen is niet gelukt. Probeer het opnieuw.' }

  revalidatePath('/')
  return { success: true }
}
