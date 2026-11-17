'use server'

/**
 * app/auth/actions.js — Server Actions de connexion, inscription, déconnexion
 *
 * Elles s'exécutent sur le serveur (le mot de passe n'est jamais traité par
 * du code du navigateur) et posent les cookies de session Supabase.
 * Les formulaires les appellent via useActionState : chaque action renvoie
 * { error, values } en cas d'erreur, pour réafficher le formulaire rempli
 * (sauf le mot de passe), ou redirige en cas de succès.
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/redirection'

// Mêmes règles que la base (supabase/migrations/003_users.sql) : on vérifie
// ici d'abord pour donner un message clair avant d'appeler Supabase.
const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8

const MESSAGES = {
  emailInvalid:     'Adresse email invalide.',
  passwordTooShort: `Mot de passe trop court : ${PASSWORD_MIN_LENGTH} caractères minimum.`,
  usernameFormat:   'Le pseudo doit faire 3 à 20 caractères : lettres sans accent, chiffres, - ou _.',
  usernameTaken:    'Ce pseudo est déjà pris.',
  emailTaken:       'Un compte existe déjà avec cet email. Connecte-toi.',
  badCredentials:   'Email ou mot de passe incorrect.',
  emailNotConfirmed:'Confirme d’abord ton adresse email avec le lien reçu par mail.',
  tooManyAttempts:  'Trop de tentatives. Réessaie dans quelques minutes.',
  unknown:          'Une erreur est survenue. Réessaie dans un instant.',
}

/** Lit un champ texte du formulaire, sans espaces autour. */
function field(formData, name) {
  return String(formData.get(name) ?? '').trim()
}

/** Adresse de l'appli (http://localhost:3000 ou l'adresse Vercel), pour le lien de l'email. */
async function siteOrigin() {
  const h = await headers()
  const origin = h.get('origin')
  if (origin) return origin
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const protocol = h.get('x-forwarded-proto') ?? 'https'
  return `${protocol}://${host}`
}

// ─── Inscription ─────────────────────────────────────────────────────────────

export async function signUp(previousState, formData) {
  const email = field(formData, 'email')
  const username = field(formData, 'username')
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(formData.get('suivant'))
  const values = { email, username }

  // 1. Vérifications locales, dans l'ordre du formulaire
  if (!USERNAME_PATTERN.test(username)) return { error: MESSAGES.usernameFormat, values }
  if (!EMAIL_PATTERN.test(email)) return { error: MESSAGES.emailInvalid, values }
  if (password.length < PASSWORD_MIN_LENGTH) return { error: MESSAGES.passwordTooShort, values }

  const supabase = await createClient()

  // 2. Pseudo libre ? (fonction SQL username_available, appelable sans compte)
  const { data: available, error: rpcError } = await supabase.rpc('username_available', { candidate: username })
  if (rpcError) {
    console.error('signUp: username_available a échoué :', rpcError.message)
    return { error: MESSAGES.unknown, values }
  }
  if (!available) return { error: MESSAGES.usernameTaken, values }

  // 3. Création du compte. Le pseudo voyage dans les métadonnées : le trigger
  //    handle_new_user le copie dans la table profiles.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      // Lien du mail de confirmation → app/auth/confirm/route.js
      emailRedirectTo: `${await siteOrigin()}/auth/confirm`,
    },
  })

  if (error) {
    switch (error.code) {
      case 'email_address_invalid':      return { error: MESSAGES.emailInvalid, values }
      case 'weak_password':              return { error: MESSAGES.passwordTooShort, values }
      case 'email_exists':
      case 'user_already_exists':        return { error: MESSAGES.emailTaken, values }
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':    return { error: MESSAGES.tooManyAttempts, values }
    }
    // Le trigger d'inscription a refusé le pseudo : quelqu'un l'a pris entre
    // la vérification (étape 2) et maintenant. Supabase ne renvoie alors
    // qu'un message générique « Database error saving new user ».
    if (error.code === 'unexpected_failure' || /database error/i.test(error.message)) {
      return { error: MESSAGES.usernameTaken, values }
    }
    console.error('signUp: erreur Supabase :', error.code, error.message)
    return { error: MESSAGES.unknown, values }
  }

  // 4a. Confirmation par email désactivée : l'utilisateur est déjà connecté.
  if (data.session) redirect(next)

  // 4b. Confirmation activée : on lui demande d'ouvrir son mail.
  //     (Si l'email avait déjà un compte, Supabase répond pareil, sans le
  //     dire : on ne révèle pas quelles adresses sont inscrites.)
  return { sent: true, values }
}

// ─── Connexion ───────────────────────────────────────────────────────────────

export async function signIn(previousState, formData) {
  const email = field(formData, 'email')
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(formData.get('suivant'))
  const values = { email }

  if (!EMAIL_PATTERN.test(email)) return { error: MESSAGES.emailInvalid, values }
  if (!password) return { error: MESSAGES.badCredentials, values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    switch (error.code) {
      case 'invalid_credentials':     return { error: MESSAGES.badCredentials, values }
      case 'email_not_confirmed':     return { error: MESSAGES.emailNotConfirmed, values }
      case 'over_request_rate_limit': return { error: MESSAGES.tooManyAttempts, values }
    }
    console.error('signIn: erreur Supabase :', error.code, error.message)
    return { error: MESSAGES.unknown, values }
  }

  redirect(next)
}

// ─── Choix du pseudo (compte sans profil) ────────────────────────────────────

/**
 * Crée le profil d'un compte qui n'en a pas (compte créé avant la migration
 * 003). Passe par la fonction SQL create_my_profile (migration 004) : les
 * utilisateurs n'ont pas le droit d'écrire directement dans profiles, et la
 * fonction ne crée que le profil de l'appelant (auth.uid()).
 */
export async function chooseUsername(previousState, formData) {
  const username = field(formData, 'username')
  const next = safeNextPath(formData.get('suivant'))
  const values = { username }

  const supabase = await createClient()
  // Une Server Action est une adresse publique : elle vérifie elle-même la session
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect(`/connexion?suivant=${encodeURIComponent(next)}`)

  if (!USERNAME_PATTERN.test(username)) return { error: MESSAGES.usernameFormat, values }

  const { error } = await supabase.rpc('create_my_profile', { new_username: username })
  if (error) {
    // 23505 : index unique sur lower(username) ; 23514 : format refusé par la base
    if (error.code === '23505') return { error: MESSAGES.usernameTaken, values }
    if (error.code === '23514') return { error: MESSAGES.usernameFormat, values }
    console.error('chooseUsername: erreur Supabase :', error.code, error.message)
    return { error: MESSAGES.unknown, values }
  }

  redirect(next)
}

// ─── Déconnexion ─────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
