// Page d'accueil — Server Component (rendu côté serveur par défaut avec App Router)
// Les variables NEXT_PUBLIC_* sont lisibles ici sans appel réseau.

export default function Home() {
  // On vérifie simplement que les variables sont définies (non vides).
  // Aucune requête Supabase n'est faite ici.
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-sky-50">
      {/* Titre de l'application */}
      <h1 className="text-3xl font-bold text-sky-800 mb-4 text-center">
        ✈ Appli aviation
      </h1>

      {/* Phrase de pitch */}
      <p className="text-lg text-sky-700 text-center max-w-sm mb-8">
        Photographiez un avion, identifiez-le et constituez votre hangar virtuel.
      </p>

      {/* Indicateur de configuration Supabase */}
      <div className="rounded-xl border border-sky-200 bg-white px-6 py-4 text-sm text-gray-700 shadow-sm">
        Supabase configuré&nbsp;:{' '}
        {supabaseConfigured ? (
          <span className="font-semibold text-green-600">oui</span>
        ) : (
          <span className="font-semibold text-red-500">
            non — copiez .env.example en .env.local et remplissez vos clés
          </span>
        )}
      </div>
    </main>
  )
}
