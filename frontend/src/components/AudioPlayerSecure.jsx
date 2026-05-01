import { useState } from 'react';
import apiService from '../services/api';
import AudioPlayer from './AudioPlayer';

/**
 * Lecteur audio sécurisé — charge une URL signée temporaire à la demande.
 * L'URL n'est jamais exposée dans le DOM avant que l'utilisateur clique Play.
 */
const AudioPlayerSecure = ({ partitionId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = async () => {
    if (audioUrl) return; // Déjà chargé
    setLoading(true);
    try {
      const { url } = await apiService.getAudioUrl(partitionId);
      setAudioUrl(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <p className="text-xs text-red-500">Audio indisponible</p>;
  }

  if (!audioUrl) {
    return (
      <button
        onClick={handleLoad}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-100 transition-all disabled:opacity-50"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {loading ? 'Chargement...' : 'Écouter l\'extrait'}
      </button>
    );
  }

  return <AudioPlayer src={audioUrl} />;
};

export default AudioPlayerSecure;
