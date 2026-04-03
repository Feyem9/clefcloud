import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const MESSE_PARTS = [
  'Entrée',
  'Kyrie',
  'Gloria',
  'Psaume',
  'Alleluia',
  'Credo',
  'Priere universelle',
  'Offertoire',
  'Sanctus',
  'Agnus Dei',
  'Communion',
  'Meditation',
  'Sortie'
];

const Messe = () => {
  const { isPremium } = useAuth();
  const [selectedPart, setSelectedPart] = useState('');
  const [partitions, setPartitions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPart) {
      setPartitions([]);
      return;
    }

    const fetchPartitions = async () => {
      setLoading(true);
      try {
        const data = await apiService.getPartitions({
          category: 'messe',
          messePart: selectedPart
        });
        setPartitions(data);
      } catch (err) {
        console.error('Erreur chargement partitions messe:', err);
        toast.error('Impossible de charger les partitions');
      } finally {
        setLoading(false);
      }
    };

    fetchPartitions();
  }, [selectedPart]);

  const handleOpen = async (id) => {
    try {
      const { url } = await apiService.getDownloadUrl(id);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Erreur lors de l\'ouverture du fichier');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-on-surface font-display mb-3 tracking-tight">
          Planificateur de Messe
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Sélectionnez une partie de la liturgie pour accéder aux partitions correspondantes du catalogue premium.
        </p>
      </div>

      {/* Selector Section */}
      <div className="bg-surface-container-low backdrop-blur-xl p-8 rounded-3xl shadow-ambient mb-10 border border-white/10">
        <label className="block text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
          Partie de la messe
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {MESSE_PARTS.map(part => (
            <button
              key={part}
              onClick={() => setSelectedPart(part)}
              className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95 ${selectedPart === part
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 scale-105'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
            >
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {selectedPart ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
            <h2 className="text-2xl font-bold text-on-surface font-display flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              {selectedPart}
              <span className="text-sm font-normal text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full ml-2">
                {partitions.length} partitions
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-80 space-y-4">
              <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary"></div>
              <p className="text-on-surface-variant animate-pulse font-medium">Recherche dans le catalogue...</p>
            </div>
          ) : partitions.length === 0 ? (
            <div className="bg-surface-container-low rounded-3xl p-16 text-center border-2 border-dashed border-white/10">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 shadow-ambient">
                <svg className="w-10 h-10 text-outline-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-3 font-display">
                Aucun résultat trouvé
              </h3>
              <p className="text-on-surface-variant max-w-md mx-auto text-lg">
                Il n'y a pas encore de partitions répertoriées pour "{selectedPart}" dans notre catalogue premium.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partitions.map((partition) => (
                <div key={partition.id} className="group bg-surface-container-low hover:bg-surface-container-high transition-all duration-300 rounded-3xl overflow-hidden shadow-ambient hover:shadow-2xl border border-white/5 active:scale-[0.98]">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-on-surface leading-tight font-display group-hover:text-primary transition-colors">
                        {partition.title}
                      </h3>
                    </div>

                    <div className="space-y-3 mb-6">
                      {partition.composer && (
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          <span className="text-sm font-medium">{partition.composer}</span>
                        </div>
                      )}

                      {partition.key && (
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                          <span className="text-sm">{partition.key}</span>
                        </div>
                      )}
                    </div>

                    {isPremium ? (
                      <button
                        onClick={() => handleOpen(partition.id)}
                        className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ouvrir la partition
                      </button>
                    ) : (
                      <div className="bg-surface-container-highest p-4 rounded-2xl text-center">
                        <p className="text-sm font-bold text-amber-600 mb-1 flex items-center justify-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          PREMIUM REQUIS
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-surface-container-low p-10 rounded-[2.5rem] border border-white/10 shadow-ambient flex flex-col justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-on-surface font-display mb-4">Planifiez vos célébrations</h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Préparez vos messes dominicales avec soin. Choisissez chaque chant selon le temps liturgique et la partie de la messe pour une expérience harmonieuse.
            </p>
          </div>
          <div className="relative group overflow-hidden rounded-[2.5rem]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1515525047844-933e4f3f9829?auto=format&fit=crop&q=80&w=800"
              alt="Musique de messe"
              className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute bottom-8 left-8 z-20">
              <p className="text-white font-bold text-xl font-display">Splendeur de la Liturgie</p>
              <p className="text-white/80">Accédez au meilleur du sacré</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messe;
