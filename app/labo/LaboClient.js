'use client';

/**
 * app/labo/LaboClient.js  — Client Component
 *
 * Interface de test de reconnaissance d'avions.
 * Conçue mobile d'abord, textes en français.
 *
 * Flux :
 *  1. L'utilisateur dépose une photo (drag-and-drop ou appareil photo).
 *  2. browser-image-compression réduit l'image à 1024 px côté navigateur.
 *  3. La photo réduite est envoyée à /api/identifier (multipart/form-data).
 *  4. Le résultat (nom, confiance, indices, suggestions) s'affiche.
 *  5. Chaque essai s'ajoute à l'historique de la session (en mémoire).
 */

import { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import AircraftCard from '@/components/AircraftCard';

// Niveaux de réflexion proposés à l'utilisateur
const THINKING_LEVELS = [
  { value: 'minimal', label: 'Très rapide (minimal)' },
  { value: 'low',    label: 'Rapide (low)' },
  { value: 'medium', label: 'Équilibré (medium)' },
  { value: 'high',   label: 'Précis (high)' },
];

// Options de compression — réduit l'image à 1024 px max avant envoi
const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

export default function LaboClient() {
  const [thinkingLevel, setThinkingLevel]   = useState('minimal');
  const [preview, setPreview]               = useState(null);   // URL blob pour l'aperçu
  const [loading, setLoading]               = useState(false);  // analyse en cours
  const [result, setResult]                 = useState(null);   // dernière réponse API
  const [selectedFiche, setSelectedFiche]   = useState(null);   // fiche avion affichée
  const [error, setError]                   = useState(null);   // message d'erreur
  const [history, setHistory]               = useState([]);     // historique session
  const [dragOver, setDragOver]             = useState(false);  // survol drag-and-drop

  const inputRef = useRef(null);

  // ── Traitement d'une image sélectionnée ──────────────────────────────────────

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    setError(null);
    setResult(null);
    setSelectedFiche(null);

    // Vérification du type MIME côté client
    const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!accepted.includes(file.type)) {
      // Le navigateur ne peut généralement pas lire le HEIC
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        setError('Format non pris en charge par ce navigateur, essayez en JPEG.');
      } else {
        setError(`Format non accepté (${file.type || 'inconnu'}). Utilisez JPEG, PNG ou WebP.`);
      }
      return;
    }

    // Aperçu immédiat de la photo originale (avant compression)
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      // Réduction de l'image à 1024 px côté navigateur
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

      // Envoi à la route serveur
      const formData = new FormData();
      formData.append('image', compressed, 'photo.jpg');
      formData.append('thinkingLevel', thinkingLevel);

      const response = await fetch('/api/identifier', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? `Erreur serveur (${response.status}).`);
        return;
      }

      setResult(data);
      // Affiche d'abord la fiche de l'avion reconnu (si disponible dans Supabase)
      setSelectedFiche(data.fichesById?.[data.aircraft_id] ?? null);

      // Ajout à l'historique (miniature + résultat)
      setHistory(prev => [
        {
          id: Date.now(),
          previewUrl: URL.createObjectURL(compressed),
          aircraft_name: data.aircraft_name,
          aircraft_id: data.aircraft_id,
          confidence: data.confidence,
          duration_ms: data.duration_ms,
        },
        ...prev,
      ]);
    } catch (err) {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [thinkingLevel]);

  // ── Drag-and-drop ────────────────────────────────────────────────────────────

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  // ── Couleur de la barre de confiance ─────────────────────────────────────────
  function confidenceColor(conf) {
    if (conf >= 0.8) return 'bg-green-500';
    if (conf >= 0.5) return 'bg-orange-400';
    return 'bg-red-500';
  }

  function confidenceLabel(conf) {
    if (conf >= 0.8) return 'text-green-700';
    if (conf >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-8 max-w-lg mx-auto">

      {/* Titre */}
      <h1 className="text-2xl font-bold text-sky-800 mb-1 text-center">
        Labo vision
      </h1>
      <p className="text-sm text-sky-600 text-center mb-6">
        Test de reconnaissance d&apos;avions par Gemini — développement uniquement
      </p>

      {/* Sélecteur du niveau de réflexion */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Niveau de réflexion
        </label>
        <select
          value={thinkingLevel}
          onChange={e => setThinkingLevel(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-sky-400
                     disabled:opacity-50"
        >
          {THINKING_LEVELS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Zone de dépôt / bouton */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-2xl border-2 border-dashed p-8 text-center transition-colors
          ${dragOver ? 'border-sky-500 bg-sky-100' : 'border-sky-300 bg-white'}
          ${loading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        {/* Aperçu de la photo pendant / après l'analyse */}
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL blob locale, next/image ne supporte pas blob:
          <img
            src={preview}
            alt="Aperçu de la photo"
            className="w-full max-h-56 object-contain rounded-xl mb-2"
          />
        ) : (
          <div className="text-sky-300 text-5xl select-none">✈</div>
        )}

        {loading ? (
          /* Indicateur de chargement */
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            <span className="text-sm text-sky-600">Analyse en cours…</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              {preview ? 'Déposez une autre photo ou' : 'Déposez une photo ici ou'}
            </p>
            {/* Bouton caché lié à l'input file */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white
                         hover:bg-sky-700 active:bg-sky-800 transition-colors"
            >
              Choisir une photo
            </button>
          </>
        )}

        {/*
          input masqué :
          - accept="image/*"         → affiche tous les formats image
          - capture="environment"    → ouvre l'appareil photo sur téléphone
          On ne peut pas avoir les deux à la fois de façon fiable sur iOS/Android,
          donc on privilégie la galerie + appareil photo via accept="image/*".
        */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={loading}
          onChange={e => {
            const file = e.target.files?.[0];
            e.target.value = ''; // permet de re-sélectionner le même fichier
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Résultat de la dernière analyse */}
      {result && !loading && (
        <section className="mt-6 space-y-4">

          {/* ── Résumé Gemini ─────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-sky-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-sky-800 mb-4">{result.aircraft_name}</h2>

            {/* Barre de confiance */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Confiance</span>
                <span className={`font-semibold ${confidenceLabel(result.confidence)}`}>
                  {Math.round(result.confidence * 100)} %
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${confidenceColor(result.confidence)}`}
                  style={{ width: `${Math.round(result.confidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Indices visuels relevés par Gemini */}
            {result.indices && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Indices relevés
                </p>
                <p className="text-sm text-gray-700">{result.indices}</p>
              </div>
            )}

            {/* 3 suggestions cliquables — affichent la fiche correspondante */}
            {result.suggestions?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  3 suggestions
                </p>
                <ol className="space-y-1.5">
                  {result.suggestions.map((id, i) => {
                    const fiche = result.fichesById?.[id];
                    const label = fiche?.name ?? id;
                    const isSelected = selectedFiche?.id === id;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => setSelectedFiche(fiche ?? null)}
                          className={`
                            w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                            text-left transition-colors
                            ${isSelected
                              ? 'bg-sky-100 border border-sky-300 text-sky-800'
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-sky-50 hover:border-sky-200'}
                          `}
                        >
                          <span className={`
                            flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0
                            ${isSelected ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'}
                          `}>
                            {i + 1}
                          </span>
                          <span className={isSelected ? 'font-semibold' : ''}>
                            {label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Temps de réponse, modèle réellement utilisé et nombre de tentatives */}
            <p className="text-xs text-gray-400 text-right">
              {result.duration_ms} ms — {thinkingLevel} — {result.model_used} — {result.attempts}{' '}
              {result.attempts > 1 ? 'tentatives' : 'tentative'}
            </p>
          </div>

          {/* ── Fiche avion (vide si Supabase pas encore alimenté) ─────────── */}
          {selectedFiche && <AircraftCard fiche={selectedFiche} />}

        </section>
      )}

      {/* Historique de la session */}
      {history.length > 1 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Historique de la session
          </h2>
          <div className="space-y-2">
            {history.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-white border border-gray-100
                           shadow-sm px-3 py-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- URL blob locale, next/image ne supporte pas blob: */}
                <img
                  src={item.previewUrl}
                  alt={item.aircraft_name}
                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.aircraft_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(item.confidence * 100)} % — {item.duration_ms} ms
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
