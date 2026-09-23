import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// The Supabase default email templates (magic link, and the email-change
// confirmation that linking an anonymous session to a real account triggers)
// point here with a one-time credential rather than a ready-made session —
// this route exchanges it for a session and sets the auth cookies. Our
// clients (lib/supabase/{client,server}.ts, via @supabase/ssr) default to
// `flowType: 'pkce'`, so `updateUser({ email })`/`signInWithOtp` issue a PKCE
// authorization code (`?code=...`), not the older `token_hash`+`type` shape —
// confirmed live: a real click landed here with only `?code=...` set. The
// `token_hash` branch is kept as a fallback for the shape verifyOtp expects,
// in case some project/template configuration ever sends that instead.
const VERIFIABLE_TYPES = new Set(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'])

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // TEMPORARY diagnostic logging — remove once the magic-link flow is
  // confirmed working end to end.
  console.error('[auth/confirm] request', {
    url: request.url,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.error('[auth/confirm] exchangeCodeForSession succeeded', {
        userId: data.user?.id,
        isAnonymous: data.user?.is_anonymous,
        email: data.user?.email,
      })
      return NextResponse.redirect(`${origin}${next}`)
    }

    // The most common cause here: the link was opened in a different
    // browser (e.g. an email app) than the one that called updateUser()/
    // signInWithOtp() — the PKCE code_verifier cookie only exists in that
    // original browser, so the exchange fails even with a fresh code.
    console.error('[auth/confirm] exchangeCodeForSession failed', {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
    })
  } else if (tokenHash && type && VERIFIABLE_TYPES.has(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
      token_hash: tokenHash,
    })
    if (!error) {
      console.error('[auth/confirm] verifyOtp succeeded', {
        userId: data.user?.id,
        isAnonymous: data.user?.is_anonymous,
        email: data.user?.email,
      })
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[auth/confirm] verifyOtp failed', {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
    })
  } else {
    console.error('[auth/confirm] no usable code/token_hash on this request', { tokenHash, type })
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
