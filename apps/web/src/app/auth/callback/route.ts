import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const returnTo = searchParams.get('returnTo')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // Determine the redirect URL based on environment
      let redirectTo = next
      
      if (returnTo === 'credits') {
        redirectTo = '/credits'
      }

      if (isLocalEnv) {
        // In development, use the origin from the request
        const redirectUrl = new URL(redirectTo, origin)
        return NextResponse.redirect(redirectUrl)
      } else {
        // In production, use the forwarded host or fallback to configured URL
        const baseUrl = forwardedHost 
          ? `https://${forwardedHost}` 
          : process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com'
        const redirectUrl = new URL(redirectTo, baseUrl)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Return the user to an error page with instructions
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com'
  return NextResponse.redirect(new URL('/auth/error', baseUrl))
}