-- =============================================================================
-- Migration 002 : fiche avion enrichie + correspondance avec Gemini
-- À exécuter APRÈS 001_aircraft.sql, dans l'éditeur SQL de Supabase
-- (ou via la CLI : supabase db push), AVANT supabase/seed/aircraft.sql.
--
-- Ajoute des colonnes, n'en supprime aucune : les pages existantes
-- (fiche, Hangar, carte) continuent de fonctionner sans modification.
-- =============================================================================

ALTER TABLE public.aircraft

  -- ── Correspondance avec Gemini ───────────────────────────────────────────────
  -- Titre de la page Wikipédia anglaise (ex. "Boeing 747"). Gemini renvoie ce
  -- titre : c'est la clé qui relie une photo identifiée à sa fiche.
  ADD COLUMN enwiki_title      text,

  -- Autres noms de l'avion, en minuscules (libellés et alias Wikidata en
  -- français et en anglais). Ex. pour Q6475 : {"airbus a320 family",
  -- "airbus a320", "a320"…}. Sert quand Gemini donne une variante du titre.
  ADD COLUMN aliases           text[]      NOT NULL DEFAULT '{}',

  -- ── Sources ──────────────────────────────────────────────────────────────────
  -- Lien vers l'article Wikipédia (français, sinon anglais) d'où vient le
  -- résumé `description`. Obligatoire : texte Wikipédia sous CC BY-SA 4.0.
  ADD COLUMN wikipedia_url     text,

  -- Sources citées par Wikidata pour chaque donnée, ex. :
  -- {"units_built": ["https://www.baesystems.com/…"], "length_m": ["https://www.wikidata.org/wiki/Q29042798"]}
  ADD COLUMN sources           jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- ── Données techniques supplémentaires (NULL si inconnues) ──────────────────
  ADD COLUMN height_m          numeric(6, 2),   -- hauteur en mètres
  ADD COLUMN range_km          integer,         -- autonomie (distance franchissable) en km
  ADD COLUMN ceiling_m         integer,         -- plafond (altitude maximale) en mètres
  ADD COLUMN service_entry     date,            -- mise en service
  ADD COLUMN retirement        date,            -- retrait du service (NULL = toujours en service ou inconnu)
  ADD COLUMN country_of_origin text,            -- pays d'origine (ex. "France / Royaume-Uni")
  ADD COLUMN engines           text,            -- motorisation (ex. "Pratt & Whitney JT9D")

  -- ── Vérification ─────────────────────────────────────────────────────────────
  -- true  : avion importé par le script et relu par l'équipe.
  -- false : avion ajouté automatiquement après une identification par Gemini
  --         (décision d'équipe du 16/11/2026), données non relues.
  ADD COLUMN verified          boolean     NOT NULL DEFAULT true;

-- Un avion Wikidata = une seule ligne. L'index simple de 001 devient inutile.
DROP INDEX IF EXISTS public.idx_aircraft_wikidata_id;
ALTER TABLE public.aircraft
  ADD CONSTRAINT aircraft_wikidata_id_key UNIQUE (wikidata_id),
  ADD CONSTRAINT aircraft_enwiki_title_key UNIQUE (enwiki_title);

-- Recherche rapide d'un nom dans la liste des alias (opérateur @> ou ANY).
CREATE INDEX idx_aircraft_aliases ON public.aircraft USING gin (aliases);

-- Rareté par défaut : 3 (Or) quand le nombre d'exemplaires est inconnu
-- (décision d'équipe du 16/11/2026, même règle que lib/wikidata.js).
ALTER TABLE public.aircraft ALTER COLUMN rarity SET DEFAULT 3;

-- RLS : inchangée (lecture publique des avions visibles, aucune écriture
-- pour anon / authenticated). Les nouvelles colonnes sont couvertes.
