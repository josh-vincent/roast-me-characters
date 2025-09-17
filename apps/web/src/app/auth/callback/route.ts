import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
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
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(error.message)}`)
      }

      // Get the user and handle profile creation/migration
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user profile exists
        const { data: existingProfile } = await supabase
          .from('roast_me_ai_users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Check for anonymous user data to migrate
          const anonUserId = cookieStore.get('anon_user_id')?.value
          let migrationData = null
          
          if (anonUserId) {
            // Get anonymous user data
            const { data: anonUser } = await supabase
              .from('roast_me_ai_users')
              .select('*')
              .eq('id', anonUserId)
              .eq('is_anonymous', true)
              .single()
            
            if (anonUser) {
              migrationData = {
                credits: anonUser.credits,
                images_created: anonUser.images_created
              }
              
              // Get all characters created by anonymous user
              const { data: anonCharacters } = await supabase
                .from('roast_me_ai_characters')
                .select('*')
                .eq('user_id', anonUserId)
              
              // Transfer ownership of characters to authenticated user
              if (anonCharacters && anonCharacters.length > 0) {
                await supabase
                  .from('roast_me_ai_characters')
                  .update({ user_id: user.id })
                  .eq('user_id', anonUserId)
              }
              
              // Delete anonymous user record
              await supabase
                .from('roast_me_ai_users')
                .delete()
                .eq('id', anonUserId)
            }
          }
          
          // Create new authenticated user profile
          const { error: profileError } = await supabase
            .from('roast_me_ai_users')
            .insert({
              id: user.id,
              email: user.email,
              google_id: user.user_metadata?.sub,
              is_anonymous: false,
              credits: Math.max(10, migrationData?.credits || 0), // Keep existing credits or give 10, whichever is higher
              images_created: migrationData?.images_created || 0,
              plan: 'free'
            })

          if (profileError) {
            console.error('Error creating user profile:', profileError)
          } else if (anonUserId) {
            console.log(`Successfully migrated anonymous user ${anonUserId} to authenticated user ${user.id}`)
          }
        }
      }
    } catch (authError) {
      console.error('Error in auth callback:', authError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // Check if user was redirected from credits page
  const returnTo = requestUrl.searchParams.get('returnTo')
  const redirectUrl = returnTo === 'credits' ? `${requestUrl.origin}/credits` : `${requestUrl.origin}/`
  
  return NextResponse.redirect(redirectUrl)
}