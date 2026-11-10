'use client';

/**
 * app/photo/PhotoClient.js — Client Component
 *
 * Écran « Scanner » de Flight Hunter, en quatre étapes (variable `step`) :
 *   1. 'idle'    : invitation à prendre une photo (fond ciel)
 *   2. 'loading' : la photo est réduite à 1024 px puis envoyée à /api/identifier
 *   3. 'result'  : soit l'avion est reconnu avec assez de confiance,
 *                  soit on propose les 3 suggestions de Gemini
 *   4. 'error'   : message d'erreur et bouton pour réessayer
 *
 * TODO (tâche Hangar) : bouton « Ajouter à mon Hangar » sur le résultat,
 * quand l'authentification et la table captures existeront.
 */

import { useState, useRef } from 'react';
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

// Classes des boutons, réutilisées sur tout l'écran (cible tactile de 48 px)
const PRIMARY_BUTTON =
  'typo-label flex min-h-12 w-full items-center justify-center gap-2 rounded-md ' +
  'bg-brand-blue px-6 text-on-brand active:bg-brand-blue-strong';
const SECONDARY_BUTTON =
  'typo-label flex min-h-12 w-full items-center justify-center gap-2 rounded-md ' +
  'px-6 text-brand-blue-strong active:bg-brand-blue-soft';

// ─── Icônes Lucide (SVG copiés depuis lucide.dev, trait de 2 px) ─────────────

function Icon({ children, className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
const ChevronIcon = (props) => (
  <Icon {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

// ─── Écran principal ─────────────────────────────────────────────────────────

export default function PhotoClient() {
  const [step, setStep]         = useState('idle'); // 'idle' | 'loading' | 'result' | 'error'
  const [preview, setPreview]   = useState(null);   // URL blob de la photo de l'utilisateur
  const [lastFile, setLastFile] = useState(null);   // pour le bouton « Réessayer »
  const [result, setResult]     = useState(null);   // réponse de /api/identifier
  const [chosenId, setChosenId] = useState(null);   // avion choisi parmi les suggestions
  const [error, setError]       = useState(null);

  // Deux champs fichier : l'un ouvre l'appareil photo, l'autre la galerie
  const cameraInputRef  = useRef(null);
  const galleryInputRef = useRef(null);

  async function analyse(file) {
    setError(null);
    setResult(null);
    setChosenId(null);
    setLastFile(file);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Ce format de photo n’est pas pris en charge. Essaie avec une photo en JPEG.');
      setStep('error');
      return;
    }

    if (preview) URL.revokeObjectURL(preview); // libère l'ancienne photo
    setPreview(URL.createObjectURL(file));
    setStep('loading');

    try {
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      const formData = new FormData();
      formData.append('image', compressed, 'photo.jpg');

      const response = await fetch('/api/identifier', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'L’analyse a échoué. Réessaie dans un instant.');
        setStep('error');
        return;
      }

      setResult(data);
      setStep('result');
    } catch {
      setError('Impossible de joindre le serveur. Vérifie ta connexion et réessaie.');
      setStep('error');
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de choisir à nouveau la même photo
    if (file) analyse(file);
  }

  function restart() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setChosenId(null);
    setError(null);
    setStep('idle');
  }

  // Avion à afficher : celui choisi par l'utilisateur, ou celui de Gemini
  // s'il est reconnu avec assez de confiance. Sinon null → liste de suggestions.
  let shownId = chosenId;
  if (!shownId && result) {
    const confident = result.aircraft_id !== UNKNOWN_ID && result.confidence >= CONFIDENCE_THRESHOLD;
    if (confident) shownId = result.aircraft_id;
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      {/* Le fond ciel n'apparaît que sur l'écran d'accueil du scan (pas pendant l'analyse) */}
      {step === 'idle' && <SkyBackground />}

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

      {step === 'loading' && <LoadingView preview={preview} />}

      {step === 'error' && (
        <ErrorView
          message={error}
          onRetry={lastFile && ACCEPTED_TYPES.includes(lastFile.type) ? () => analyse(lastFile) : null}
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
            onWrongChoice={() => setChosenId(null)}
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

// ─── Étape 1 : invitation à prendre une photo ────────────────────────────────

function IdleView({ onCamera, onGallery }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-3 text-center">
        <h1 className="typo-title-lg text-ink">Scanner un avion</h1>
        <p className="typo-body-lg text-ink-muted">
          Cadre l’avion en entier, de profil si possible. On s’occupe du reste.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={onCamera} className={PRIMARY_BUTTON}>
          <CameraIcon />
          Prendre une photo
        </button>
        <button type="button" onClick={onGallery} className={SECONDARY_BUTTON}>
          <ImageIcon />
          Choisir dans la galerie
        </button>
      </div>
    </div>
  );
}

// ─── Étape 2 : analyse en cours ──────────────────────────────────────────────

function LoadingView({ preview }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6" aria-live="polite">
      <UserPhoto preview={preview} />
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-blue border-t-transparent" />
        <p className="typo-label text-ink">Analyse en cours…</p>
      </div>
    </div>
  );
}

// ─── Étape 3a : avion reconnu (ou choisi par l'utilisateur) ──────────────────

function AircraftResult({ preview, result, aircraftId, chosenByUser, onWrongChoice, onRestart }) {
  // La fiche vient de Supabase ; si elle manque, on affiche au moins le nom
  const fiche = result.fichesById?.[aircraftId];
  const name = fiche?.name ?? (aircraftId === result.aircraft_id ? result.aircraft_name : aircraftId);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <UserPhoto preview={preview} />

      <div className="flex flex-col gap-3">
        <p className="typo-data flex items-center gap-1.5 text-success">
          <CheckIcon className="h-4 w-4" />
          {chosenByUser
            ? 'Choisi par toi'
            : `Identifié · ${Math.round(result.confidence * 100)} %`}
        </p>

        <div>
          <h1 className="typo-display-xl text-ink">{name}</h1>
          {fiche?.manufacturer && (
            <p className="typo-body-sm text-ink-muted">{fiche.manufacturer}</p>
          )}
        </div>

        {fiche?.rarity && (
          <div>
            <RarityTag rarity={fiche.rarity} />
          </div>
        )}

        {fiche?.description && <p className="typo-body text-ink">{fiche.description}</p>}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button type="button" onClick={onRestart} className={PRIMARY_BUTTON}>
          <CameraIcon />
          Scanner un autre avion
        </button>
        {chosenByUser && (
          <button type="button" onClick={onWrongChoice} className={SECONDARY_BUTTON}>
            Revoir les suggestions
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Étape 3b : confiance faible ou avion inconnu → 3 suggestions ────────────

function SuggestionsView({ preview, result, onChoose, onRestart }) {
  const unknown = result.aircraft_id === UNKNOWN_ID;
  const suggestions = (result.suggestions ?? []).filter(id => id !== UNKNOWN_ID);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <UserPhoto preview={preview} />

      <div className="flex flex-col gap-2">
        <h1 className="typo-title-lg text-ink">
          {unknown ? 'Avion non reconnu' : 'On hésite'}
        </h1>
        <p className="typo-body text-ink-muted">
          {unknown
            ? 'Il n’est peut-être pas encore dans notre catalogue.'
            : 'Aide-nous : lequel de ces avions as-tu photographié ?'}
          {unknown && suggestions.length > 0 && ' Serait-ce l’un de ceux-ci ?'}
        </p>
      </div>

      {suggestions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {suggestions.map(id => {
            const fiche = result.fichesById?.[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChoose(id)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-md border border-line
                             bg-surface-raised p-4 text-left active:bg-brand-blue-soft"
                >
                  <span className="flex-1">
                    <span className="typo-item-title block text-ink">{fiche?.name ?? id}</span>
                    {fiche?.manufacturer && (
                      <span className="typo-body-sm block text-ink-muted">{fiche.manufacturer}</span>
                    )}
                  </span>
                  <ChevronIcon className="h-5 w-5 text-ink-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto">
        <button type="button" onClick={onRestart} className={PRIMARY_BUTTON}>
          <CameraIcon />
          Reprendre une photo
        </button>
      </div>
    </div>
  );
}

// ─── Étape 4 : erreur ────────────────────────────────────────────────────────

function ErrorView({ message, onRetry, onRestart }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center" role="alert">
        <AlertIcon className="h-10 w-10 text-danger" />
        <h1 className="typo-title-md text-ink">Oups, ça n’a pas marché</h1>
        <p className="typo-body text-ink-muted">{message}</p>
      </div>

      <div className="flex flex-col gap-2">
        {onRetry ? (
          <>
            <button type="button" onClick={onRetry} className={PRIMARY_BUTTON}>
              Réessayer
            </button>
            <button type="button" onClick={onRestart} className={SECONDARY_BUTTON}>
              Prendre une autre photo
            </button>
          </>
        ) : (
          <button type="button" onClick={onRestart} className={PRIMARY_BUTTON}>
            <CameraIcon />
            Prendre une autre photo
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Photo prise par l'utilisateur ───────────────────────────────────────────

function UserPhoto({ preview }) {
  if (!preview) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL blob locale, next/image ne gère pas blob:
    <img
      src={preview}
      alt="Ta photo"
      className="aspect-[4/3] w-full rounded-lg border border-line bg-surface-raised object-cover"
    />
  );
}
