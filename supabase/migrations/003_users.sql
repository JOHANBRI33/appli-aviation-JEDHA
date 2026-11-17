-- =============================================================================
-- Migration 003 : utilisateurs, captures (Hangar), photos et classement
-- À exécuter APRÈS 001 et 002, dans l'éditeur SQL de Supabase.
--
-- Décisions d'équipe appliquées ici :
--   • les points ne sont PAS stockés : ils se calculent à partir des avions
--     « vus en vrai » et du barème de lib/points.js (voir get_leaderboard) ;
--   • une seule ligne par utilisateur et par avion ; « collection » peut
--     passer à « seen », jamais l'inverse ; la première photo est gardée ;
--   • le lieu est un texte libre facultatif, jamais de coordonnées GPS ;
--   • le pseudo est la seule information d'un utilisateur visible des autres ;
--   • les photos sont privées : seul leur auteur peut les voir.
--
-- Tout est dans une transaction : si une instruction échoue, rien n'est créé.
-- =============================================================================

BEGIN;

-- =============================================================================
-- TABLE profiles : le profil public d'un utilisateur (son pseudo)
-- Une ligne par compte, créée automatiquement à l'inscription (trigger plus bas).
-- L'email reste dans auth.users, jamais copié ici.
-- =============================================================================
CREATE TABLE public.profiles (
  -- Même identifiant que le compte Supabase Auth. Supprimer le compte
  -- supprime le profil (puis ses captures, par cascade).
  id          uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,

  -- Pseudo : 3 à 20 caractères, lettres sans accent, chiffres, - et _.
  username    text        NOT NULL
              CONSTRAINT profiles_username_format CHECK (username ~ '^[A-Za-z0-9_-]{3,20}$'),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Pseudo unique sans tenir compte des majuscules : « Johan » et « johan »
-- ne peuvent pas exister tous les deux.
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles (lower(username));

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Création du profil à l'inscription ───────────────────────────────────────
-- L'écran /inscription appelle supabase.auth.signUp avec
-- options.data = { username: 'pseudo' } : le pseudo arrive dans
-- raw_user_meta_data. S'il manque, est mal formé ou déjà pris, l'insertion
-- échoue et l'inscription entière est annulée (pas de compte sans pseudo).
-- SECURITY DEFINER : la fonction s'exécute avec les droits de son
-- propriétaire, car le rôle d'Auth n'a pas le droit d'écrire dans profiles.
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(NEW.raw_user_meta_data ->> 'username', '') = '' THEN
    RAISE EXCEPTION 'Pseudo manquant à l''inscription';
  END IF;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TABLE captures : les avions du Hangar d'un utilisateur
--   status = 'seen'       → vu en vrai : photo obligatoire, rapporte des points
--   status = 'collection' → ajouté depuis une fiche : pas de photo, 0 point
-- =============================================================================
CREATE TYPE capture_status AS ENUM ('seen', 'collection');

CREATE TABLE public.captures (
  id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Propriétaire. Rempli automatiquement avec l'utilisateur connecté :
  -- l'appli n'a pas à l'envoyer (et n'en a pas le droit, voir les GRANT).
  user_id      uuid           NOT NULL DEFAULT auth.uid()
                              REFERENCES public.profiles (id) ON DELETE CASCADE,

  -- Avion du catalogue. Pas de cascade : on ne peut pas supprimer un avion
  -- qui est dans un Hangar (on le masque avec aircraft.visible = false).
  aircraft_id  text           NOT NULL REFERENCES public.aircraft (id),

  status       capture_status NOT NULL,

  -- Chemin de la photo dans le bucket « captures » : <user_id>/<fichier>.
  photo_path   text,

  -- Lieu en texte libre, facultatif (« Meeting de La Ferté-Alais »). Jamais de GPS.
  place        text           CHECK (place IS NULL OR char_length(place) <= 120),

  -- Confiance de Gemini (0 à 1) au moment de la reconnaissance.
  confidence   numeric(3, 2)  CHECK (confidence BETWEEN 0 AND 1),

  -- Date du passage en « vu en vrai » (affichée sur la carte à collectionner).
  -- Remplie par le trigger ci-dessous, jamais par l'appli.
  seen_at      timestamptz,

  created_at   timestamptz    NOT NULL DEFAULT now(),
  updated_at   timestamptz    NOT NULL DEFAULT now(),

  -- Une seule ligne par utilisateur et par avion : pas de doublon.
  CONSTRAINT captures_user_aircraft_unique UNIQUE (user_id, aircraft_id),

  -- Photo et date obligatoires si « seen » ; rien de tout ça si « collection ».
  CONSTRAINT captures_status_fields CHECK (
       (status = 'seen'       AND photo_path IS NOT NULL AND seen_at IS NOT NULL)
    OR (status = 'collection' AND photo_path IS NULL AND seen_at IS NULL
                              AND place IS NULL AND confidence IS NULL)
  )
);

-- La contrainte d'unicité sert déjà d'index pour « les captures de
-- l'utilisateur X ». Celui-ci accélère la vérification de la clé étrangère.
CREATE INDEX captures_aircraft_id_idx ON public.captures (aircraft_id);

CREATE TRIGGER trg_captures_updated_at
  BEFORE UPDATE ON public.captures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── « Rien ne redescend » et date du passage en « vu en vrai » ───────────────
-- À l'ajout « seen » ou au passage collection → seen : seen_at = maintenant.
-- Une capture déjà « seen » ne change plus (ni statut, ni photo, ni
-- confiance, ni date) : seul le lieu peut être corrigé.
CREATE FUNCTION public.captures_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.seen_at := CASE WHEN NEW.status = 'seen' THEN now() END;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.status = 'seen' THEN
    IF NEW.status      IS DISTINCT FROM OLD.status
    OR NEW.photo_path  IS DISTINCT FROM OLD.photo_path
    OR NEW.confidence  IS DISTINCT FROM OLD.confidence THEN
      RAISE EXCEPTION 'Avion déjà vu en vrai : seul le lieu peut être modifié';
    END IF;
    NEW.seen_at := OLD.seen_at;
  ELSIF NEW.status = 'seen' THEN
    NEW.seen_at := now();          -- passage collection → seen
  ELSE
    NEW.seen_at := NULL;           -- reste en collection
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_captures_guard
  BEFORE INSERT OR UPDATE ON public.captures
  FOR EACH ROW EXECUTE FUNCTION public.captures_guard();

-- =============================================================================
-- DROITS SUR LES COLONNES
-- Supabase donne par défaut tous les droits sur les tables à anon et
-- authenticated ; la RLS filtre ensuite les lignes. On restreint ici aussi
-- les colonnes, pour que l'appli ne puisse toucher que ce qu'elle doit.
-- (service_role, utilisé par les scripts serveur, garde tous ses droits.)
-- =============================================================================
REVOKE ALL ON public.profiles FROM anon, authenticated;
-- Les autres ne voient que l'identifiant et le pseudo (pas created_at).
-- Attention : un select('*') sur profiles échoue, il faut nommer les colonnes.
GRANT SELECT (id, username) ON public.profiles TO authenticated;
GRANT UPDATE (username)     ON public.profiles TO authenticated;

REVOKE ALL ON public.captures FROM anon, authenticated;
GRANT SELECT, DELETE ON public.captures TO authenticated;
-- Ni user_id (rempli par défaut), ni seen_at (trigger), ni dates techniques
GRANT INSERT (aircraft_id, status, photo_path, place, confidence) ON public.captures TO authenticated;
GRANT UPDATE (status, photo_path, place, confidence)              ON public.captures TO authenticated;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;

-- (select auth.uid()) plutôt que auth.uid() : Postgres le calcule une seule
-- fois par requête au lieu d'une fois par ligne (recommandation Supabase).

-- Tout utilisateur connecté peut lire les pseudos (colonnes limitées plus haut).
CREATE POLICY "profils lisibles par les utilisateurs connectés"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Chacun ne modifie que son propre profil.
CREATE POLICY "profil modifiable par son propriétaire"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Pas de politique INSERT ni DELETE sur profiles : le profil est créé par le
-- trigger d'inscription et supprimé avec le compte.

-- Chacun ne lit que ses propres captures.
CREATE POLICY "captures lisibles par leur propriétaire"
  ON public.captures FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Chacun n'ajoute des captures que pour lui, avec une photo de son dossier.
CREATE POLICY "captures ajoutées par leur propriétaire"
  ON public.captures FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND (photo_path IS NULL OR split_part(photo_path, '/', 1) = (select auth.uid())::text)
  );

-- Chacun ne modifie que ses captures (et la photo reste dans son dossier).
CREATE POLICY "captures modifiables par leur propriétaire"
  ON public.captures FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (
    user_id = (select auth.uid())
    AND (photo_path IS NULL OR split_part(photo_path, '/', 1) = (select auth.uid())::text)
  );

-- Chacun ne supprime que ses captures (« Retirer de mon Hangar »).
CREATE POLICY "captures supprimables par leur propriétaire"
  ON public.captures FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- =============================================================================
-- STORAGE : bucket privé « captures » pour les photos des utilisateurs
-- Chemin d'une photo : <user_id>/<fichier>.jpg. Privé = pas d'URL publique :
-- l'appli affiche les photos par des URL signées de courte durée.
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('captures', 'captures', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- (storage.foldername(name))[1] = premier dossier du chemin = <user_id>.

CREATE POLICY "photos lisibles par leur auteur"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'captures' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "photos envoyées dans son propre dossier"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'captures' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "photos supprimables par leur auteur"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'captures' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- Pas de politique UPDATE : une photo envoyée ne peut jamais être remplacée
-- (un envoi avec upsert: true est refusé).

-- =============================================================================
-- FONCTION username_available : le pseudo est-il libre ?
-- Appelée par /inscription AVANT de créer le compte, pour afficher « Ce pseudo
-- est déjà pris » (l'erreur du trigger d'inscription, elle, est générique).
-- SECURITY DEFINER : un visiteur non connecté n'a pas le droit de lire
-- profiles. La fonction ne renvoie qu'un booléen, rien d'autre.
-- =============================================================================
CREATE FUNCTION public.username_available(candidate text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(candidate)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.username_available(text) FROM public;
GRANT  EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

-- =============================================================================
-- FONCTION get_leaderboard : le classement
-- Renvoie UNIQUEMENT le pseudo, le nombre d'avions vus en vrai et le score.
-- Le score applique le barème de lib/points.js (À GARDER IDENTIQUE) :
--   rareté 1 → 10, 2 → 25, 3 → 50, 4 → 100, 5 → 200.
-- SECURITY DEFINER : elle doit additionner les captures de TOUS les
-- utilisateurs, que la RLS cache à chacun (on ne lit que les siennes).
-- Seuls les avions visibles comptent, comme dans le Hangar.
-- Les utilisateurs sans avion vu en vrai n'apparaissent pas.
-- =============================================================================
CREATE FUNCTION public.get_leaderboard(max_rows integer DEFAULT 50)
RETURNS TABLE (username text, seen_count integer, score integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.username,
    count(*)::integer AS seen_count,
    sum(CASE a.rarity
          WHEN 1 THEN 10
          WHEN 2 THEN 25
          WHEN 3 THEN 50
          WHEN 4 THEN 100
          WHEN 5 THEN 200
          ELSE 0
        END)::integer AS score
  FROM public.captures c
  JOIN public.profiles p ON p.id = c.user_id
  JOIN public.aircraft a ON a.id = c.aircraft_id AND a.visible
  WHERE c.status = 'seen'
  GROUP BY p.id, p.username
  -- Ordre stable en cas d'égalité : score, puis nombre d'avions vus, puis
  -- pseudo alphabétique sans tenir compte des majuscules. lower(username)
  -- est unique (index profiles_username_unique) : deux lignes ne sont
  -- jamais à égalité, l'ordre est donc toujours le même d'un appel à l'autre.
  ORDER BY score DESC, seen_count DESC, lower(p.username)
  -- Entre 1 et 100 lignes, quoi que demande l'appelant
  LIMIT least(greatest(coalesce(max_rows, 50), 1), 100);
$$;

-- Supabase donne l'exécution à public ET, explicitement, à anon : on retire
-- les deux, seuls les utilisateurs connectés voient le classement.
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;

COMMIT;
