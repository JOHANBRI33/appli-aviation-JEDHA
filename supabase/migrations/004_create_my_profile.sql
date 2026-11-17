-- =============================================================================
-- Migration 004 : « Choisis ton pseudo » pour un compte sans profil
-- À exécuter APRÈS 003, dans l'éditeur SQL de Supabase.
--
-- Cas visé : un compte créé avant la migration 003 (ou dont le profil a
-- manqué) n'a pas de ligne dans profiles. Sans profil, il ne peut rien
-- ajouter à son Hangar (captures.user_id référence profiles.id).
--
-- Les utilisateurs n'ont pas le droit d'écrire directement dans profiles
-- (pas de GRANT INSERT, pas de politique INSERT : migration 003). Cette
-- fonction est le seul moyen, et elle ne crée QUE le profil de l'appelant :
-- l'identifiant vient de auth.uid(), jamais d'un paramètre.
-- =============================================================================

BEGIN;

CREATE FUNCTION public.create_my_profile(new_username text)
RETURNS void
LANGUAGE plpgsql
-- Droits du propriétaire : nécessaire pour insérer dans profiles
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion obligatoire' USING ERRCODE = '42501';
  END IF;

  -- Le format est aussi vérifié par la contrainte profiles_username_format,
  -- et l'unicité par l'index profiles_username_unique (erreur 23505).
  -- Profil déjà existant : rien ne change (pas de renommage par ici).
  INSERT INTO public.profiles (id, username)
  VALUES (auth.uid(), new_username)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Supabase donne l'exécution à public et à anon : seuls les connectés l'ont.
REVOKE EXECUTE ON FUNCTION public.create_my_profile(text) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.create_my_profile(text) TO authenticated;

COMMIT;
