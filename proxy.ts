import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

// `middleware.ts` was renamed to `proxy.ts` in Next.js 16 — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
