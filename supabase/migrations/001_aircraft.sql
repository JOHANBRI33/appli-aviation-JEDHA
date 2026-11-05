-- =============================================================================
-- Migration 001 : table aircraft
-- À exécuter dans l'éditeur SQL de Supabase (ou via la CLI : supabase db push)
-- =============================================================================

-- Crée un type ENUM pour les catégories d'avions.
-- Un ENUM évite les fautes de frappe et facilite les filtres côté UI.
CREATE TYPE aircraft_category AS ENUM ('ligne', 'militaire', 'collection', 'autre');

-- =============================================================================
-- TABLE aircraft
-- Catalogue de référence : un avion = une ligne.
-- Alimentée par le script scripts/import-catalogue/run.js (données Wikidata +
-- photos Wikimedia Commons). Jamais écrite depuis l'application cliente.
-- =============================================================================
CREATE TABLE public.aircraft (

  -- ── Identifiant ─────────────────────────────────────────────────────────────
  -- Clé primaire textuelle (ex. "a320", "rafale") : même valeur que dans
  -- catalogue.json, renvoyée par Gemini, utilisée dans les URLs (/avions/a320).
  id               text           PRIMARY KEY,

  -- ── Informations générales ──────────────────────────────────────────────────
  -- Nom complet affiché à l'utilisateur (ex. "Airbus A320").
  name             text           NOT NULL,

  -- Constructeur ou fabricant (ex. "Airbus", "Dassault Aviation").
  manufacturer     text           NOT NULL,

  -- Catégorie : 'ligne' = aviation commerciale, 'militaire' = aéronef de combat,
  -- 'collection' = appareil historique ou de collection, 'autre' = inclassable.
  category         aircraft_category NOT NULL DEFAULT 'autre',

  -- Texte descriptif en français (2-4 phrases) destiné à l'utilisateur,
  -- affiché dans la fiche de l'avion.
  description      text,

  -- Indices visuels pour Gemini (repris du champ "description" de catalogue.json) :
  -- forme des ailes, position des moteurs, dérive… Utilisés dans le prompt
  -- d'identification, jamais affichés directement à l'utilisateur.
  recognition_hints text,

  -- ── Données techniques ──────────────────────────────────────────────────────
  -- Date du premier vol (ex. 1988-02-22).  NULL si inconnue.
  first_flight     date,

  -- Vitesse maximale en km/h (entier). NULL si non disponible.
  max_speed_kmh    integer,

  -- Longueur de l'appareil en mètres (décimal). NULL si non disponible.
  length_m         numeric(6, 2),

  -- Envergure en mètres (décimal). NULL si non disponible.
  wingspan_m       numeric(6, 2),

  -- Nombre total d'exemplaires construits. NULL si inconnu ou en production.
  units_built      integer,

  -- ── Rareté ──────────────────────────────────────────────────────────────────
  -- Entier de 1 (très commun) à 5 (extrêmement rare), calculé par le script
  -- d'import à partir de units_built. Sert au calcul des points.
  rarity           integer        NOT NULL DEFAULT 1
                   CHECK (rarity BETWEEN 1 AND 5),

  -- ── Photo Wikimedia Commons ─────────────────────────────────────────────────
  -- URL de la miniature (1024 px de large) hébergée par Wikimedia Commons.
  image_url        text,

  -- Auteur de la photo, tel que renvoyé par l'API Commons (texte brut, sans HTML).
  image_author     text,

  -- Licence de la photo (ex. "CC BY-SA 4.0").
  image_license    text,

  -- Lien vers la page de la licence (ex. "https://creativecommons.org/licenses/by-sa/4.0/").
  image_license_url text,

  -- Lien vers la page de description du fichier sur Commons (pour le crédit obligatoire).
  image_source_url  text,

  -- ── Référence Wikidata ───────────────────────────────────────────────────────
  -- Identifiant Wikidata de l'avion (ex. "Q6383"). Utilisé pour relancer
  -- l'import ou afficher un lien vers la fiche Wikidata.
  wikidata_id      text,

  -- ── Visibilité ───────────────────────────────────────────────────────────────
  -- Si false, l'avion est masqué dans l'application (données incomplètes
  -- ou avion retiré du catalogue) sans avoir à supprimer la ligne.
  visible          boolean        NOT NULL DEFAULT true,

  -- ── Horodatages ──────────────────────────────────────────────────────────────
  -- Date d'insertion automatique.
  created_at       timestamptz    NOT NULL DEFAULT now(),

  -- Date de dernière modification. Mis à jour manuellement ou via trigger.
  updated_at       timestamptz    NOT NULL DEFAULT now()

);

-- Index secondaire sur wikidata_id pour faciliter les mises à jour de l'import.
CREATE INDEX idx_aircraft_wikidata_id ON public.aircraft (wikidata_id);

-- Index pour filtrer rapidement les avions visibles (très fréquent).
CREATE INDEX idx_aircraft_visible ON public.aircraft (visible);

-- =============================================================================
-- TRIGGER : met à jour updated_at automatiquement à chaque UPDATE
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_aircraft_updated_at
  BEFORE UPDATE ON public.aircraft
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- Principe : les avions sont des données publiques de référence.
--   • Tout le monde (y compris les utilisateurs non connectés) peut lire
--     les avions dont visible = true.
--   • Aucun rôle applicatif (anon, authenticated) ne peut insérer, modifier
--     ou supprimer des avions. Seul le rôle service_role (non exposé) le peut,
--     via le script d'import côté serveur.
-- =============================================================================
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : accessible à tous pour les avions visibles.
CREATE POLICY "lecture publique des avions visibles"
  ON public.aircraft
  FOR SELECT
  TO anon, authenticated
  USING (visible = true);

-- Remarque : sans politique INSERT/UPDATE/DELETE, ces opérations sont
-- implicitement bloquées pour les rôles anon et authenticated.
-- Le script d'import utilise service_role (clé serveur secrète) qui
-- contourne la RLS — c'est le comportement attendu.
