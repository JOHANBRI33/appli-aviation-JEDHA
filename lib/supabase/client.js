import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase pour le navigateur (Client Components).
 * Utilise les variables publiques NEXT_PUBLIC_* exposées au navigateur.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
