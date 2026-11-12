'use client';

/**
 * app/photo/PhotoClient.js — Client Component
 *
 * Parcours « Scanner un avion » (Figma « Écrans MVP », écrans 03 à 05).
 * Étapes (variable `step`) :
 *   1. 'idle'    : choix entre appareil photo et galerie (fond ciel)
 *   2. 'loading' : écran 03 « Analyse en cours… » — la photo est réduite à
 *                  1024 px puis envoyée à /api/identifier ; bouton Annuler
 *   3. 'result'  : - confiance ≥ 70 % → l'avion reconnu
 *                  - sinon, ou avion inconnu → écran 04 « On n'est pas sûrs… »
 *                    avec les 3 suggestions de Gemini
 *   4. 'error'   : message d'erreur et bouton pour réessayer
 *
 * TODO (tâche fiche avion) : quand app/avions/[id] existera, l'avion reconnu
 * ouvrira sa fiche (écran 05, avec « Ajouter à mon Hangar ») au lieu du
 * résumé affiché ici par AircraftResult.
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import SkyBackground from '@/components/SkyBackground';
import RarityTag from '@/components/RarityTag';

// En dessous de ce seuil, on demande à l'utilisateur de choisir parmi les suggestions
const CONFIDENCE_THRESHOLD = 0.7;

// Réponse de Gemini quand l'avion n'est pas dans le catalogue (voir lib/identification.js)
const UNKNOWN_ID = 'inconnu';

// Réduction de la photo côté navigateur avant envoi
const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// Certains téléphones et galeries ne donnent pas le type du fichier
// (file.type vide, surtout pour le HEIC) : on le déduit alors de l'extension.
const TYPES_BY_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
};

/** Type de la photo (« image/jpeg »…), ou null si le format n'est pas accepté. */
function photoType(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const type = file.type || TYPES_BY_EXTENSION[extension] || '';
  return ACCEPTED_TYPES.includes(type) ? type : null;
}

/** Lit la réponse JSON du serveur, ou null si ce n'en est pas (page d'erreur HTML…). */
async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Libellés des catégories (colonne aircraft.category)
const CATEGORY_LABELS = {
  ligne:      'Ligne',
  militaire:  'Militaire',
  collection: 'Collection',
  autre:      'Autre',
};

// Boutons du Figma (composant « Bouton ») : 54 px de haut, rayon 14 px
const PRIMARY_BUTTON =
  'typo-label flex h-[54px] w-full items-center justify-center gap-2 rounded-md ' +
  'bg-brand-blue px-5 text-on-brand active:bg-brand-blue-strong';
const OUTLINE_BUTTON =
  'typo-label flex h-[54px] w-full items-center justify-center gap-2 rounded-md ' +
  'border-[1.5px] border-line bg-surface-raised px-5 text-ink active:bg-brand-blue-soft';
const TEXT_LINK =
  'flex min-h-11 items-center justify-center text-sm font-semibold text-brand-blue';

// ─── Icônes Lucide (SVG copiés depuis lucide.dev, trait de 2 px) ─────────────

function Icon({ children, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

const CameraIcon = (props) => (
  <Icon {...props}>
    <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
    <circle cx="12" cy="13" r="3" />
  </Icon>
);
const ImageIcon = (props) => (
  <Icon {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Icon>
);
const PlaneIcon = (props) => (
  <Icon {...props}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </Icon>
);
const CheckIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);
const AlertIcon = (props) => (
  <Icon {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);
const ChevronRightIcon = (props) => (
  <Icon {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);
const ChevronLeftIcon = (props) => (
  <Icon {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

// ─── Écran principal ─────────────────────────────────────────────────────────

export default function PhotoClient() {
  const [step, setStep]         = useState('idle'); // 'idle' | 'loading' | 'result' | 'error'
  const [preview, setPreview]   = useState(null);   // URL blob de la photo de l'utilisateur
  const [lastFile, setLastFile] = useState(null);   // pour le bouton « Réessayer »
  const [result, setResult]     = useState(null);   // réponse de /api/identifier
  const [chosenId, setChosenId] = useState(null);   // avion choisi parmi les suggestions
  const [showSuggestions, setShowSuggestions] = useState(false); // « Ce n'est pas lui ? »
  const [error, setError]       = useState(null);

  // Deux champs fichier : l'un ouvre l'appareil photo, l'autre la galerie
  const cameraInputRef  = useRef(null);
  const galleryInputRef = useRef(null);
  // Permet d'annuler l'envoi en cours (bouton « Annuler » de l'analyse)
  const abortRef = useRef(null);

  async function analyse(file) {
    setError(null);
    setResult(null);
    setChosenId(null);
    setShowSuggestions(false);
    setLastFile(file);

    if (!photoType(file)) {
      setError('Ce format de photo n’est pas pris en charge. Essaie avec une photo en JPEG.');
      setStep('error');
      return;
    }

    if (preview) URL.revokeObjectURL(preview); // libère l'ancienne photo
    setPreview(null);
    setStep('loading');

    const controller = new AbortController();
    abortRef.current = controller;

    // 1. Réduction à 1024 px. Elle échoue quand le navigateur ne sait pas lire
    //    la photo (HEIC hors Safari, par exemple) : ce n'est pas un problème
    //    de connexion, on le dit clairement.
    let compressed;
    try {
      compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    } catch (err) {
      console.warn('Réduction de la photo impossible :', err);
      if (controller.signal.aborted) return;
      setError('Ton navigateur n’arrive pas à lire cette photo (souvent un HEIC d’iPhone). Essaie avec une photo en JPEG.');
      setStep('error');
      return;
    }
    if (controller.signal.aborted) return; // annulé pendant la réduction

    // Aperçu à partir de la photo réduite, en JPEG : il s'affiche même
    // quand le navigateur ne sait pas afficher l'original (HEIC)
    setPreview(URL.createObjectURL(compressed));

    // 2. Envoi au serveur
    let response;
    try {
      const formData = new FormData();
      formData.append('image', compressed, 'photo.jpg');
      response = await fetch('/api/identifier', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') return; // l'utilisateur a annulé
      setError('Impossible de joindre le serveur. Vérifie ta connexion et réessaie.');
      setStep('error');
      return;
    }

    // 3. Lecture de la réponse : une erreur peut arriver sous forme de page
    //    HTML (photo trop lourde refusée par l'hébergeur, panne…), pas en JSON
    const data = await readJson(response);
    if (controller.signal.aborted) return;

    if (!response.ok || !data) {
      setError(data?.error ?? `L’analyse a échoué (erreur ${response.status}). Réessaie dans un instant.`);
      setStep('error');
      return;
    }

    setResult(data);
    setStep('result');
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de choisir à nouveau la même photo
    if (file) analyse(file);
  }

  function restart() {
    abortRef.current?.abort();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setChosenId(null);
    setShowSuggestions(false);
    setError(null);
    setStep('idle');
  }

  // Avion à afficher : celui choisi par l'utilisateur, ou celui de Gemini
  // s'il est reconnu avec assez de confiance. Sinon null → écran des suggestions.
  let shownId = chosenId;
  if (!shownId && result && !showSuggestions) {
    const confident = result.aircraft_id !== UNKNOWN_ID && result.confidence >= CONFIDENCE_THRESHOLD;
    if (confident) shownId = result.aircraft_id;
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Fond ciel : partout sauf pendant l'analyse (écran bleu nuit) */}
      {step !== 'loading' && <SkyBackground />}

      {/* Champs fichier masqués, ouverts par les boutons */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {step === 'idle' && (
        <IdleView
          onCamera={() => cameraInputRef.current?.click()}
          onGallery={() => galleryInputRef.current?.click()}
        />
      )}

      {step === 'loading' && <LoadingView preview={preview} onCancel={restart} />}

      {step === 'error' && (
        <ErrorView
          message={error}
          onRetry={lastFile && photoType(lastFile) ? () => analyse(lastFile) : null}
          onRestart={restart}
        />
      )}

      {step === 'result' && result && (
        shownId ? (
          <AircraftResult
            preview={preview}
            result={result}
            aircraftId={shownId}
            chosenByUser={!!chosenId}
            onShowSuggestions={() => { setChosenId(null); setShowSuggestions(true); }}
            onRestart={restart}
          />
        ) : (
          <SuggestionsView
            preview={preview}
            result={result}
            onChoose={setChosenId}
            onRestart={restart}
          />
        )
      )}
    </main>
  );
}

// ─── Étape 1 : choix de la photo ─────────────────────────────────────────────

function IdleView({ onCamera, onGallery }) {
  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="flex flex-1 flex-col justify-center gap-3 text-center">
        <h1 className="typo-title-lg text-ink">Scanner un avion</h1>
        <p className="typo-body-lg text-ink-muted">
          Cadre l’avion en entier, de profil si possible. On s’occupe du reste.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <button type="button" onClick={onCamera} className={PRIMARY_BUTTON}>
          <CameraIcon />
          Prendre une photo
        </button>
        <button type="button" onClick={onGallery} className={OUTLINE_BUTTON}>
          <ImageIcon />
          Choisir dans la galerie
        </button>
      </div>
    </div>
  );
}

// ─── Étape 2 : écran 03 « Analyse en cours… » ────────────────────────────────

/** Coins blancs du cadre de visée, posés sur la photo. */
function ViewfinderCorners() {
  const corner = 'absolute h-11 w-11 border-on-brand';
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-65 w-65 -translate-x-1/2 -translate-y-1/2">
      <span className={`${corner} left-0 top-0 border-l-[3px] border-t-[3px]`} />
      <span className={`${corner} right-0 top-0 border-r-[3px] border-t-[3px]`} />
      <span className={`${corner} bottom-0 left-0 border-b-[3px] border-l-[3px]`} />
      <span className={`${corner} bottom-0 right-0 border-b-[3px] border-r-[3px]`} />
    </div>
  );
}

/**
 * Barre de progression : la durée réelle de l'analyse n'est pas connue,
 * la barre avance donc doucement jusqu'à 90 % puis attend la réponse.
 */
function ProgressBar() {
  const [width, setWidth] = useState('5%');
  useEffect(() => {
    // Lancée juste après l'affichage pour que la transition CSS se déclenche
    const id = requestAnimationFrame(() => setWidth('90%'));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-brand/15">
      <div
        className="h-full rounded-full bg-brand-blue transition-[width] duration-6000 ease-out"
        style={{ width }}
      />
    </div>
  );
}

function LoadingView({ preview, onCancel }) {
  return (
    <div className="flex flex-1 flex-col bg-brand-navy">
      {/* Photo de l'utilisateur avec le cadre de visée */}
      <div className="relative h-[64dvh] overflow-hidden bg-linear-to-b from-brand-blue to-brand-blue-soft">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- URL blob locale, next/image ne gère pas blob:
          <img src={preview} alt="Ta photo" className="h-full w-full object-cover" />
        )}
        <ViewfinderCorners />
      </div>

      {/* Panneau d'analyse */}
      <div className="flex flex-1 flex-col items-center gap-3 px-6 pt-8 pb-6 text-center" aria-live="polite">
        <h1 className="typo-title-lg text-on-brand">Analyse en cours…</h1>
        <p className="text-sm text-on-brand/70">On compare ta photo aux avions du catalogue</p>
        <ProgressBar />
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 min-h-11 px-6 text-[15px] font-semibold text-on-brand"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Étape 3a : avion reconnu (ou choisi par l'utilisateur) ──────────────────

function AircraftResult({ preview, result, aircraftId, chosenByUser, onShowSuggestions, onRestart }) {
  // La fiche vient de Supabase ; si elle manque, on affiche au moins le nom
  const fiche = result.fichesById?.[aircraftId];
  const name = fiche?.name ?? (aircraftId === result.aircraft_id ? result.aircraft_name : aircraftId);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <UserPhoto preview={preview} />

      <div className="flex flex-col gap-3">
        <p className="typo-data flex items-center gap-1.5 text-success">
          <CheckIcon className="h-4 w-4" />
          {chosenByUser
            ? 'Choisi par toi'
            : `Identifié · ${Math.round(result.confidence * 100)} %`}
        </p>

        {fiche?.rarity && (
          <div>
            <RarityTag rarity={fiche.rarity} />
          </div>
        )}

        <div>
          <h1 className="typo-display-xl text-ink">{name}</h1>
          {fiche?.manufacturer && (
            <p className="typo-body text-ink-muted">{fiche.manufacturer}</p>
          )}
        </div>

        {fiche?.description && <p className="typo-body text-ink">{fiche.description}</p>}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3.5">
        <button type="button" onClick={onRestart} className={PRIMARY_BUTTON}>
          Scanner un autre avion
        </button>
        <button type="button" onClick={onShowSuggestions} className={TEXT_LINK}>
          Ce n’est pas lui ? Voir les suggestions
        </button>
      </div>
    </div>
  );
}

// ─── Étape 3b : écran 04 « On n'est pas sûrs… » ──────────────────────────────

function SuggestionsView({ preview, result, onChoose, onRestart }) {
  const suggestions = (result.suggestions ?? []).filter(id => id !== UNKNOWN_ID);

  return (
    <div className="flex flex-1 flex-col">
      {/* Barre titre avec retour */}
      <button
        type="button"
        onClick={onRestart}
        className="flex h-13 items-center gap-1.5 self-start px-4 text-base font-semibold text-ink"
      >
        <ChevronLeftIcon className="h-6 w-6" />
        Résultat
      </button>

      <div className="flex flex-col gap-3.5 px-6 pt-2 pb-8">
        <UserPhoto preview={preview} className="h-40" />

        <div className="flex flex-col gap-1.5">
          <h1 className="typo-title-lg text-ink">On n’est pas sûrs…</h1>
          <p className="typo-body text-ink-muted">
            {suggestions.length > 0
              ? 'Ton avion est peut-être l’un de ceux-ci. Choisis le bon pour ouvrir sa fiche.'
              : 'Ton avion n’est peut-être pas encore dans notre catalogue.'}
          </p>
        </div>

        {suggestions.length > 0 && (
          <ul className="flex flex-col gap-3.5">
            {suggestions.map(id => (
              <li key={id}>
                <SuggestionRow id={id} fiche={result.fichesById?.[id]} onChoose={onChoose} />
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col items-center gap-3.5 pt-1.5">
          {/* La recherche par nom est l'écran 10 du Figma (à créer) */}
          <Link href="/recherche" className={OUTLINE_BUTTON}>
            Chercher par nom
          </Link>
          <button type="button" onClick={onRestart} className={TEXT_LINK}>
            Reprendre la photo
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ligne d'une suggestion (composant « Ligne avion » du Figma). */
function SuggestionRow({ id, fiche, onChoose }) {
  const details = [fiche?.manufacturer, CATEGORY_LABELS[fiche?.category]].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={() => onChoose(id)}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-raised
                 py-3 pl-3 pr-3.5 text-left active:bg-brand-blue-soft"
    >
      {/* Vignette : dégradé + avion (pas de photo Commons ici, faute de place pour le crédit) */}
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-linear-to-b from-brand-blue to-brand-blue-soft text-on-brand">
        <PlaneIcon className="h-6.5 w-6.5" strokeWidth={1.5} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="typo-item-title truncate text-ink">{fiche?.name ?? id}</span>
        {details && <span className="truncate text-xs text-ink-muted">{details}</span>}
      </span>
      <ChevronRightIcon className="h-4.5 w-4.5 text-ink" />
    </button>
  );
}

// ─── Étape 4 : erreur ────────────────────────────────────────────────────────

function ErrorView({ message, onRetry, onRestart }) {
  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center" role="alert">
        <AlertIcon className="h-10 w-10 text-danger" />
        <h1 className="typo-title-md text-ink">Oups, ça n’a pas marché</h1>
        <p className="typo-body text-ink-muted">{message}</p>
      </div>

      <div className="flex flex-col items-center gap-3.5">
        {onRetry && (
          <button type="button" onClick={onRetry} className={PRIMARY_BUTTON}>
            Réessayer
          </button>
        )}
        <button type="button" onClick={onRestart} className={onRetry ? TEXT_LINK : PRIMARY_BUTTON}>
          Reprendre la photo
        </button>
      </div>
    </div>
  );
}

// ─── Photo prise par l'utilisateur ───────────────────────────────────────────

function UserPhoto({ preview, className = 'aspect-4/3' }) {
  if (!preview) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL blob locale, next/image ne gère pas blob:
    <img
      src={preview}
      alt="Ta photo"
      className={`w-full rounded-[18px] bg-surface-raised object-cover ${className}`}
    />
  );
}
