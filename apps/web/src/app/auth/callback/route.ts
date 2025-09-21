import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'
import { migrateAnonymousCharacters } from '@/app/actions/character-actions'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const returnTo = searchParams.get('returnTo')
  const anonSessionId = searchParams.get('anonSessionId')

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

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile exists for the authenticated user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          daily_credits_used: 0,
          daily_credits_reset_at: new Date().toISOString(),
          credits: 0
        }, {
          onConflict: 'id',
          ignoreDuplicates: true
        })
      
      if (profileError) {
        console.error('Error ensuring profile exists:', profileError)
        // Don't fail the auth flow if profile creation fails
      }
      
      // Migrate anonymous characters if session ID is provided
      if (anonSessionId) {
        const migrationResult = await migrateAnonymousCharacters(anonSessionId)
        console.log('Migration result:', migrationResult)
      }
      
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