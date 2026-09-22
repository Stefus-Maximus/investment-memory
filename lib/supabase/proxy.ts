import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session cookie if needed — do not remove this call, and do
  // not add logic between client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No login flow exists yet, so every visitor gets an anonymous Supabase
  // session on first request. This satisfies the `auth.uid() = user_id` RLS
  // policies and can later be upgraded to a real account (email/magic link)
  // without losing data, since the auth.uid() stays the same.
  if (!user) {
    await supabase.auth.signInAnonymously()
  }

  return supabaseResponse
}
