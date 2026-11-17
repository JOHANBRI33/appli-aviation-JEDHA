import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { loginUrl } from '@/lib/redirection'

// Pages réservées aux utilisateurs connectés (début du chemin).
// Le proxy n'est qu'une première barrière : chaque page et route vérifie
// aussi la session elle-même (lib/auth.js), comme le conseille la doc Next.
const PROTECTED_PREFIXES = ['/hangar']

/**
 * Rafraîchit la session Supabase à chaque requête et protège les pages privées.
 * Appelée par proxy.js (Next 16 : « proxy » remplace « middleware »).
 *
 * Pourquoi c'est nécessaire : les Server Components ne peuvent pas écrire de
 * cookies. Quand le jeton de connexion expire (1 h), c'est ici qu'il est
 * renouvelé, puis transmis à la fois aux pages (request.cookies) et au
 * navigateur (response.cookies). Code repris de la doc @supabase/ssr.
 *
 * @param {import('next/server').NextRequest} request
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          // En-têtes anti-cache : une réponse qui pose un cookie de session
          // ne doit jamais être mise en cache et servie à quelqu'un d'autre.
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    }
  )

  // Ne rien mettre entre createServerClient et getClaims (consigne Supabase) :
  // getClaims vérifie le jeton et le renouvelle s'il a expiré.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims?.sub)

  const { pathname, search } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected && !isLoggedIn) {
    // Redirection vers /connexion, en gardant les cookies et en-têtes
    // éventuellement posés par Supabase (sinon la session serait perdue).
    const redirect = NextResponse.redirect(new URL(loginUrl(pathname + search), request.url))
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
    for (const header of ['cache-control', 'expires', 'pragma']) {
      const value = response.headers.get(header)
      if (value) redirect.headers.set(header, value)
    }
    return redirect
  }

  // Toujours renvoyer CETTE réponse : c'est elle qui porte les cookies à jour.
  return response
}
