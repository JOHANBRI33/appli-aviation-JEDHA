import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase pour le serveur (Server Components, Route Handlers).
 * Lit et écrit les cookies de session via next/headers.
 * La fonction est async car cookies() est asynchrone depuis Next.js 15.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            // Appelé depuis un Server Component, qui ne peut pas écrire de
            // cookies : on ignore. proxy.js renouvelle la session à chaque
            // requête (lib/supabase/proxy.js). Les Server Actions et les
            // Route Handlers, eux, peuvent écrire les cookies.
          }
        },
      },
    }
  )
}
