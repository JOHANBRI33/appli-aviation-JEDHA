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
 *   5. 'resume-failed' : retour de la connexion sans résultat gardé
 *                  (sessionStorage indisponible) → « Reprenez la photo »
 *
 * Sur l'écran du résultat, « Ajouter à mon Hangar » envoie la photo et crée
 * la capture (lib/enregistrer-capture.js), puis affiche les points gagnés.
 * Seul un avion qui a un identifiant du catalogue peut rejoindre le Hangar.
 *
 * Props :
 *   resume  {boolean}  true au retour de /connexion (?reprise=1) : on
 *                      réaffiche le résultat gardé (app/photo/reprise.js)
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import SkyBackground from '@/components/SkyBackground';
import RarityTag from '@/components/RarityTag';
import RarityBadge from '@/components/RarityBadge';
import { MapPinIcon } from '@/components/icons';
import { pointsForRarity } from '@/lib/points';
import { loginUrl } from '@/lib/redirection';
import { newAttemptId, saveSeenCapture } from '@/lib/enregistrer-capture';
import { savePending, takePending } from './reprise';

// En dessous de ce seuil, on demande à l'utilisateur de choisir parmi les suggestions
const CONFIDENCE_THRESHOLD = 0.7;

// Délai maximum de l'analyse (Gemini peut réessayer côté serveur s'il est saturé)
const ANALYSE_TIMEOUT_MS = 45_000;

// Dernier lieu saisi, proposé pour la photo suivante (même meeting)
const LAST_PLACE_KEY = 'flight-hunter:dernier-lieu';

/** Dernier lieu saisi, ou '' (localStorage peut être bloqué : navigation privée…). */
function readLastPlace() {
  try {
    return localStorage.getItem(LAST_PLACE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeLastPlace(place) {
  try {
    if (place) localStorage.setItem(LAST_PLACE_KEY, place);
  } catch {
    // Pas grave : le champ sera simplement vide la prochaine fois
  }
}

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

export default function PhotoClient({ resume = false }) {
  // 'idle' | 'loading' | 'result' | 'error' | 'resuming' | 'resume-failed'
  const [step, setStep]         = useState(resume ? 'resuming' : 'idle');
  const [preview, setPreview]   = useState(null);   // URL blob de la photo de l'utilisateur
  const [photo, setPhoto]       = useState(null);   // photo réduite (JPEG), envoyée au Hangar
  const [attemptId, setAttemptId] = useState(null); // nom de la photo dans Storage, fixé une fois par photo
  const [initialPlace, setInitialPlace] = useState(''); // lieu saisi avant une reconnexion
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

  // Retour de /connexion : on réaffiche le résultat gardé, sans nouvelle analyse
  useEffect(() => {
    if (!resume) return;
    let cancelled = false;
    (async () => {
      const pending = await takePending();
      // L'adresse redevient /photo : un rechargement ne relance pas la reprise
      window.history.replaceState(null, '', '/photo');
      if (cancelled) return;
      if (!pending) {
        setStep('resume-failed');
        return;
      }
      setPhoto(pending.photo);
      setAttemptId(pending.attemptId ?? newAttemptId());
      setPreview(URL.createObjectURL(pending.photo));
      setResult(pending.result);
      if (pending.chosenByUser) setChosenId(pending.aircraftId);
      setInitialPlace(pending.place ?? '');
      setStep('result');
    })();
    return () => { cancelled = true; };
  }, [resume]);

  async function analyse(file) {
    setError(null);
    setResult(null);
    setChosenId(null);
    setShowSuggestions(false);
    setLastFile(file);
    setPhoto(null);
    setInitialPlace('');

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
    // quand le navigateur ne sait pas afficher l'original (HEIC).
    // La photo réduite reste en mémoire : « Réessayer » la renvoie sans
    // repasser par l'appareil photo, et c'est elle qui ira dans le Hangar.
    setPreview(URL.createObjectURL(compressed));
    setPhoto(compressed);
    setAttemptId(newAttemptId());

    await identify(compressed, controller);
  }

  /** Envoie la photo réduite à /api/identifier, avec un délai maximum. */
  async function identify(compressed, controller = new AbortController()) {
    abortRef.current = controller;
    setError(null);
    setStep('loading');

    // Délai dépassé (réseau faible) : on coupe l'envoi et on propose Réessayer
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, ANALYSE_TIMEOUT_MS);

    try {
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
        if (err.name === 'AbortError' && !timedOut) return; // l'utilisateur a annulé
        setError(timedOut
          ? 'L’analyse prend trop de temps : le réseau est sans doute faible. Réessaie.'
          : 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.');
        setStep('error');
        return;
      }

      // Lecture de la réponse : une erreur peut arriver sous forme de page
      // HTML (photo trop lourde refusée par l'hébergeur, panne…), pas en JSON
      const data = await readJson(response);
      if (controller.signal.aborted && !timedOut) return;

      if (!response.ok || !data) {
        setError(data?.error ?? `L’analyse a échoué (erreur ${response.status}). Réessaie dans un instant.`);
        setStep('error');
        return;
      }

      setResult(data);
      setStep('result');
    } finally {
      clearTimeout(timer);
    }
  }

  /** « Réessayer » : renvoie la photo déjà réduite, sinon refait la réduction. */
  function retry() {
    if (photo) identify(photo);
    else if (lastFile) analyse(lastFile);
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
    setPhoto(null);
    setInitialPlace('');
    setResult(null);
    setChosenId(null);
    setShowSuggestions(false);
    setError(null);
    setStep('idle');
  }

  /** « Scanner un autre avion » après un ajout : rouvre directement l'appareil photo. */
  function scanAgain() {
    restart();
    // Appelé dans le geste de l'utilisateur (clic) : le navigateur l'autorise
    cameraInputRef.current?.click();
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

      {step === 'resume-failed' && <ResumeFailedView onRestart={restart} />}

      {step === 'error' && (
        <ErrorView
          message={error}
          onRetry={photo || (lastFile && photoType(lastFile)) ? retry : null}
          onRestart={restart}
        />
      )}

      {step === 'result' && result && (
        shownId ? (
          <AircraftResult
            key={shownId}
            preview={preview}
            photo={photo}
            attemptId={attemptId}
            initialPlace={initialPlace}
            result={result}
            aircraftId={shownId}
            chosenByUser={!!chosenId}
            onShowSuggestions={() => { setChosenId(null); setShowSuggestions(true); }}
            onRestart={restart}
            onScanAgain={scanAgain}
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

function AircraftResult({
  preview, photo, attemptId, initialPlace, result, aircraftId, chosenByUser,
  onShowSuggestions, onRestart, onScanAgain,
}) {
  const router = useRouter();
  // 'idle' | 'saving' | 'added' | 'already-seen'
  const [saveStep, setSaveStep]   = useState('idle');
  const [saveError, setSaveError] = useState(null);
  // Lieu prérempli : celui saisi avant une reconnexion, sinon le dernier lieu
  // utilisé (souvent le même meeting). Ce composant ne s'affiche qu'après
  // une analyse, jamais au rendu serveur : localStorage est donc lisible ici.
  const [place, setPlace]         = useState(() => initialPlace || readLastPlace());

  // La fiche vient de Supabase ; si elle manque, on affiche au moins le nom
  const fiche = result.fichesById?.[aircraftId];
  const name = fiche?.name ?? (aircraftId === result.aircraft_id ? result.aircraft_name : aircraftId);

  // Seul un avion du catalogue peut entrer dans le Hangar. Une fiche venue de
  // Wikidata sans ajout au catalogue a pour identifiant un numéro « Q… ».
  const inCatalogue = Boolean(fiche) && !/^Q\d+$/.test(fiche.id);
  const points = pointsForRarity(fiche?.rarity);

  async function addToHangar() {
    setSaveError(null);
    setSaveStep('saving');

    const saved = await saveSeenCapture({
      aircraftId,
      photo,
      attemptId,
      place,
      // Confiance de Gemini seulement pour l'avion qu'il a lui-même reconnu
      confidence: chosenByUser ? null : result.confidence,
    });

    if (saved.status === 'logged-out') {
      // Session expirée : on garde le résultat le temps de se reconnecter.
      // Si sessionStorage refuse, le retour affichera « Reprenez la photo ».
      await savePending({ result, aircraftId, chosenByUser, place, photo, attemptId });
      router.push(loginUrl('/photo?reprise=1'));
      return;
    }
    if (saved.status === 'error') {
      // La photo réduite reste en mémoire : le bouton devient « Réessayer »
      setSaveError(saved.message);
      setSaveStep('idle');
      return;
    }
    writeLastPlace(place.trim());
    setSaveStep(saved.status); // 'added' ou 'already-seen'
  }

  if (saveStep === 'added' || saveStep === 'already-seen') {
    return (
      <SavedView
        aircraftId={aircraftId}
        name={name}
        rarity={fiche?.rarity}
        points={saveStep === 'added' ? points : null}
        onScanAgain={onScanAgain}
      />
    );
  }

  const canAdd = inCatalogue && photo && attemptId;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 px-6 pt-8 pb-4">
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
        </div>

        {canAdd ? (
          // Lieu facultatif, en texte libre (jamais de position GPS)
          <label className="flex w-full flex-col gap-1.5">
            <span className="typo-data text-ink-muted">Lieu (facultatif)</span>
            <span className="flex h-13 items-center gap-2.5 rounded-md border border-line bg-surface-raised px-3.5 text-ink-muted">
              <MapPinIcon className="h-4.5 w-4.5" />
              <input
                type="text"
                value={place}
                onChange={e => setPlace(e.target.value)}
                maxLength={120}
                enterKeyHint="done"
                placeholder="Ex. Meeting de La Ferté-Alais"
                className="typo-body h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-muted"
              />
            </span>
          </label>
        ) : (
          // Avion absent du catalogue : pas de capture possible (clé étrangère)
          <p className="typo-body-sm rounded-md bg-brand-blue-soft px-3.5 py-3 text-ink">
            Cet avion n’est pas encore dans notre catalogue : il ne peut pas rejoindre ton Hangar pour l’instant.
          </p>
        )}

        {fiche?.description && <p className="typo-body text-ink">{fiche.description}</p>}

        <div className="flex flex-col items-center">
          <button type="button" onClick={onShowSuggestions} className={TEXT_LINK}>
            Ce n’est pas lui ? Voir les suggestions
          </button>
          {canAdd && (
            <button type="button" onClick={onRestart} className={TEXT_LINK}>
              Reprendre la photo
            </button>
          )}
        </div>
      </div>

      {/* Action principale collée en bas de l'écran, à portée de pouce,
          même quand la description est longue */}
      <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-line bg-surface px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {canAdd ? (
          <>
            {saveError && (
              <p role="alert" className="typo-body-sm flex items-center gap-2 text-danger">
                <AlertIcon className="h-4 w-4" />
                {saveError}
              </p>
            )}
            <button
              type="button"
              onClick={addToHangar}
              disabled={saveStep === 'saving'}
              className={`${PRIMARY_BUTTON} disabled:opacity-60`}
            >
              {saveStep === 'saving'
                ? 'Ajout en cours…'
                : saveError ? 'Réessayer' : 'Ajouter à mon Hangar'}
            </button>
          </>
        ) : (
          <button type="button" onClick={onRestart} className={PRIMARY_BUTTON}>
            Scanner un autre avion
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Étape 3c : ajouté au Hangar (ou déjà dedans) ────────────────────────────

/**
 * points = nombre de points gagnés (« +50 pts », en orange récompense),
 * ou null si l'avion était déjà vu en vrai : on garde la première photo et
 * l'utilisateur ne gagne rien de plus (lien vers sa carte).
 */
function SavedView({ aircraftId, name, rarity, points, onScanAgain }) {
  const added = points !== null;

  return (
    <div className="flex flex-1 flex-col px-6 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center" aria-live="polite">
        <RarityBadge rarity={rarity} width={96} />
        {added ? (
          <>
            <p className="typo-display-reward text-reward">+{points}</p>
            <h1 className="typo-title-md text-ink">
              Ajouté à ton Hangar · <span className="text-reward-text">+{points} pts</span>
            </h1>
            <p className="typo-body text-ink-muted">Le {name} rejoint tes avions vus en vrai.</p>
          </>
        ) : (
          <>
            <h1 className="typo-title-md text-ink">Déjà dans ton Hangar</h1>
            <p className="typo-body text-ink-muted">
              Tu as déjà vu le {name} en vrai : on garde ta première photo, sans nouveaux points.
            </p>
            <Link href={`/hangar/carte/${encodeURIComponent(aircraftId)}`} className={TEXT_LINK}>
              Voir sa carte
            </Link>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        {/* Rouvre directement l'appareil photo : enchaîner les avions du meeting */}
        <button type="button" onClick={onScanAgain} className={PRIMARY_BUTTON}>
          <CameraIcon />
          Scanner un autre avion
        </button>
        <Link href="/hangar" className={OUTLINE_BUTTON}>
          Voir mon Hangar
        </Link>
      </div>
    </div>
  );
}

// ─── Retour de la connexion sans résultat gardé ──────────────────────────────

function ResumeFailedView({ onRestart }) {
  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center" role="alert">
        <CameraIcon className="h-10 w-10 text-brand-blue" />
        <h1 className="typo-title-md text-ink">Reprenez la photo</h1>
        <p className="typo-body text-ink-muted">
          Ta session avait expiré et ta photo n’a pas pu être gardée pendant la connexion.
        </p>
      </div>
      <button type="button" onClick={onRestart} className={PRIMARY_BUTTON}>
        Reprendre la photo
      </button>
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
