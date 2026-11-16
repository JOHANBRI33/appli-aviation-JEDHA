import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase « administrateur » (clé service_role) : contourne la RLS.
 *
 * SERVEUR UNIQUEMENT (`server-only` fait échouer le build si un composant
 * navigateur l'importe). Sert à ajouter dans la table aircraft un avion
 * identifié par Gemini qui n'y est pas encore (décision d'équipe du 16/11/2026).
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 *          null si SUPABASE_SERVICE_ROLE_KEY n'est pas configurée
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    // Pas de session utilisateur : ce client agit au nom du serveur
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
