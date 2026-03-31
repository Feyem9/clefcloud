import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import PDFViewer from '../components/PDFViewer';
import AudioPlayer from '../components/AudioPlayer';
import PartitionCardSkeleton from '../components/PartitionCardSkeleton';
import { MESSE_PARTS } from '../constants';
import { toast } from 'react-toastify';

const PREMIUM_PRICE_LABEL = '5 000 FCFA/mois';

const Library = () => {
  const { currentUser } = useAuth();
  const [partitions, setPartitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [messePartFilter, setMessePartFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [viewingPDF, setViewingPDF] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(null);
  // Mémoriser la vue dans le localStorage
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('clefcloud_view_mode') || 'grid'
  );

  useEffect(() => {
    localStorage.setItem('clefcloud_view_mode', viewMode);
  }, [viewMode]);

  // Fetch partitions avec filtres
  useEffect(() => {
    if (!currentUser) return;

    const timer = setTimeout(() => {
      fetchData();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [currentUser, searchTerm, categoryFilter, messePartFilter, showFavorites]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let data;
      if (showFavorites) {
        data = await apiService.getFavorites();
      } else {
        data = await apiService.getPartitions({
          search: searchTerm,
          category: categoryFilter,
          messePart: messePartFilter
        });
      }
      setPartitions(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des partitions:', error);
      toast.error('Erreur lors du chargement des partitions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette partition ?')) {
      try {
        await apiService.deletePartition(id);
        toast.success('🗑️ Partition supprimée avec succès');
        setPartitions(prevPartitions => prevPartitions.filter(p => p.id !== id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la partition');
      }
    }
  };

  const handleViewPDF = async (partition) => {
    try {
      const response = await apiService.getDownloadUrl(partition.id);
      const { url } = response;
      setViewingPDF(url);
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      toast.error(`Impossible de charger le fichier: ${error.message}`);
    }
  };

  const handleDownload = async (partition) => {
    try {
      const { url } = await apiService.getDownloadUrl(partition.id);
      window.open(url, '_blank');
      toast.success('📥 Téléchargement démarré');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de télécharger le fichier');
    }
  };

  const handleBuyPartition = async (partition) => {
    setBuyingId(partition.id);
    try {
      const response = await apiService.checkoutPartition(partition.id);
      if (response.transaction_url) {
        window.location.href = response.transaction_url;
      } else {
        toast.error('Erreur lors de l\'initialisation du paiement');
      }
    } catch (error) {
      console.error('Erreur achat partition:', error);
      toast.error('Impossible d\'initier le paiement');
    } finally {
      setBuyingId(null);
    }
  };

  const handleToggleFavorite = async (partitionId) => {
    setIsTogglingFavorite(partitionId);
    try {
      const { isFavorite } = await apiService.toggleFavorite(partitionId);
      setPartitions(prev => prev.map(p =>
        p.id === partitionId ? { ...p, isFavorite } : p
      ));
      if (showFavorites && !isFavorite) {
        setPartitions(prev => prev.filter(p => p.id !== partitionId));
      }
      toast.info(isFavorite ? '❤️ Ajouté aux favoris' : '💔 Retiré des favoris');
    } catch (error) {
      console.error('Erreur favoris:', error);
      toast.error('Erreur lors de la mise à jour des favoris');
    } finally {
      setIsTogglingFavorite(null);
    }
  };

  // Vérifie si l'utilisateur a accès au contenu d'une partition
  const hasAccess = (partition) => {
    // L'auteur a toujours accès
    if (partition.created_by === currentUser?.id) return true;
    // Si la partition a des URLs de contenu, le backend a validé l'accès
    if (partition.storage_path || partition.audio_url) return true;
    // Pas de prix = gratuit = accès pour tous
    if (!partition.price || partition.price === 0) return true;
    return false;
  };

  const sortedAndFilteredPartitions = partitions
    .filter(partition => {
      // Les filtres complexes (recherche, catégorie) sont gérés par le backend.
      // On garde ici les filtres clients simples.
      const matchesOwner = ownerFilter === 'all' || partition.created_by === currentUser.id;
      return matchesOwner;
    })
    .sort((a, b) => {
      if (sortOrder === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortOrder === 'date_desc') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const getCategoryBadgeClass = (category) => {
    const classes = {
      messe: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      concert: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      autre: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return classes[category] || classes.autre;
  };

  const getTagColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700',
      'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-700',
      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
      'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-10 bg-surface-container-high rounded w-1/3 mb-8 animate-pulse"></div>
        <div className="h-40 bg-surface-container-high rounded-xl mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <PartitionCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface font-display mb-2">
            Bibliothèque de Partitions
          </h1>
          <p className="text-on-surface-variant text-sm">
            {partitions.length} partition{partitions.length > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex gap-3">
          {/* Toggle View Mode */}
          <div className="flex bg-surface-variant rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${viewMode === 'grid'
                ? 'bg-surface-container-highest shadow-ambient'
                : 'text-outline-variant'
                }`}
              title="Vue grille"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${viewMode === 'list'
                ? 'bg-surface-container-highest shadow-ambient'
                : 'text-outline-variant'
                }`}
              title="Vue liste"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <Link
            to="/upload"
            className="bg-primary-600 text-on-primary px-6 py-2 rounded-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-2 shadow-ambient hover:shadow-ambient"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Ajouter une partition</span>
            <span className="sm:hidden">Ajouter</span>
          </Link>
        </div>
      </div>

      {/* Filtres améliorés */}
      <div className="bg-surface-container-lowest shadow-ambient rounded-xl shadow-ambient p-6 mb-6 transition-colors ">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-outline-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-lg font-semibold text-on-surface font-display">Filtres</h2>
          </div>

          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${showFavorites
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            <svg className={`w-5 h-5 ${showFavorites ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {showFavorites ? 'Mes Favoris' : 'Tous les morceaux'}
          </button>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transition-opacity ${showFavorites ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              🔍 Rechercher
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Titre, compositeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2  bg-surface-container-highest text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-transparent focus:bg-surface-container-lowest transition-all"
              />
              <svg className="w-5 h-5 text-outline-variant absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-outline-variant hover:text-on-surface-variant"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Propriétaire */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              👤 Propriétaire
            </label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-2  bg-surface-container-highest text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-transparent focus:bg-surface-container-lowest transition-all"
            >
              <option value="all">Toutes les partitions</option>
              <option value="mine">Mes partitions uniquement</option>
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              📁 Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                if (e.target.value !== 'messe') {
                  setMessePartFilter('all');
                }
              }}
              className="w-full px-3 py-2  bg-surface-container-highest text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-transparent focus:bg-surface-container-lowest transition-all"
            >
              <option value="all">Toutes</option>
              <option value="messe">Messe</option>
              <option value="concert">Concert</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Partie de la messe (conditionnel) */}
          {categoryFilter === 'messe' ? (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">
                ⛪ Partie de la messe
              </label>
              <select
                value={messePartFilter}
                onChange={(e) => setMessePartFilter(e.target.value)}
                className="w-full px-3 py-2  bg-surface-container-highest text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-transparent focus:bg-surface-container-lowest transition-all"
              >
                <option value="all">Toutes</option>
                {MESSE_PARTS.map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Trier par */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              🔄 Trier par
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2  bg-surface-container-highest text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-transparent focus:bg-surface-container-lowest transition-all"
            >
              <option value="date_desc">Plus récents</option>
              <option value="title_asc">Titre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Indicateur de filtres actifs */}
        {(searchTerm || categoryFilter !== 'all' || ownerFilter !== 'all' || messePartFilter !== 'all') && (
          <div className="mt-4 pt-4 bg-surface-container-low">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-on-surface-variant">Filtres actifs:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-container dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  Recherche: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {ownerFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-container dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  Mes partitions
                  <button onClick={() => setOwnerFilter('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-container dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {messePartFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-container dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  {messePartFilter}
                  <button onClick={() => setMessePartFilter('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setMessePartFilter('all');
                  setOwnerFilter('all');
                }}
                className="text-sm text-primary hover:underline ml-2"
              >
                Réinitialiser tout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des partitions */}
      {sortedAndFilteredPartitions.length === 0 ? (
        <div className="bg-surface-container-lowest shadow-ambient rounded-xl shadow-ambient p-12 text-center transition-colors ">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-outline-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-on-surface font-display mb-2">
              Aucune partition trouvée
            </h3>
            <p className="text-outline-variant mb-6">
              {partitions.length === 0
                ? "Commencez par ajouter votre première partition à la bibliothèque"
                : "Aucune partition ne correspond à vos critères de recherche. Essayez de modifier les filtres."
              }
            </p>
            {partitions.length === 0 && (
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-primary-600 text-on-primary px-6 py-3 rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-ambient hover:shadow-ambient"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une partition
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Vue Grille */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {sortedAndFilteredPartitions.map((partition) => (
                <div
                  key={partition.id}
                  className="bg-surface-container-lowest shadow-ambient rounded-xl shadow-ambient hover:shadow-ambient transition-all duration-300 flex flex-col  overflow-hidden group"
                >
                  {/* Header coloré */}
                  <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-600"></div>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Titre et catégorie */}
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h3 className="text-xl font-semibold text-on-surface font-display flex-1 line-clamp-2 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors">
                        {partition.title}
                      </h3>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getCategoryBadgeClass(partition.category)}`}>
                          {partition.category}
                        </span>
                        <button
                          onClick={() => handleToggleFavorite(partition.id)}
                          disabled={isTogglingFavorite === partition.id}
                          className={`p-1.5 rounded-full transition-all ${partition.isFavorite
                              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'text-outline-variant hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                          title={partition.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <svg className={`w-5 h-5 ${partition.isFavorite ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="space-y-2 mb-4 flex-1">
                      {partition.composer && (
                        <div className="flex items-start gap-2 text-sm">
                          <svg className="w-4 h-4 text-outline-variant mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-on-surface-variant">{partition.composer}</span>
                        </div>
                      )}

                      {partition.key && (
                        <div className="flex items-start gap-2 text-sm">
                          <svg className="w-4 h-4 text-outline-variant mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <span className="text-on-surface-variant">{partition.key}</span>
                        </div>
                      )}

                      {partition.messePart && (
                        <div className="flex items-start gap-2 text-sm">
                          <svg className="w-4 h-4 text-outline-variant mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-on-surface-variant">{partition.messePart}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {partition.tags && partition.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {partition.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 ${getTagColor(index)} text-xs font-medium rounded-full border transition-all hover:scale-105 shadow-ambient`}
                          >
                            #{tag}
                          </span>
                        ))}
                        {partition.tags.length > 3 && (
                          <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-xs font-medium rounded-full">
                            +{partition.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Propriétaire */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-blue-800 text-sm font-semibold shadow-ambient">
                        {partition.user?.email?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="text-sm text-on-surface-variant">
                          {partition.created_by === currentUser.id ? (
                            <span className="font-semibold text-primary">Vous</span>
                          ) : (
                            <span>{partition.user?.email || 'Utilisateur'}</span>
                          )}
                        </span>
                        <p className="text-xs text-outline-variant">{new Date(partition.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Lecteur Audio Avancé */}
                    {partition.audio_url && (
                      <div className="mb-4">
                        <AudioPlayer src={partition.audio_url} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-between items-center">
                      {/* Prix */}
                      {partition.price > 0 && !hasAccess(partition) && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-tertiary">
                            {partition.price.toLocaleString()} FCFA
                          </span>
                          <button
                            onClick={() => handleBuyPartition(partition)}
                            disabled={buyingId === partition.id}
                            className="px-3 py-1.5 bg-amber-500 text-on-primary text-xs font-semibold rounded-xl hover:bg-amber-600 transition-all shadow-ambient hover:shadow-ambient active:scale-95 disabled:opacity-50"
                          >
                            {buyingId === partition.id ? '...' : '🛒 Acheter'}
                          </button>
                        </div>
                      )}
                      {partition.price > 0 && hasAccess(partition) && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                          ✓ Débloqué
                        </span>
                      )}
                      {(!partition.price || partition.price === 0) && <div />}

                      <div className="flex gap-2">
                        {hasAccess(partition) && partition.storage_path ? (
                          <>
                            <button onClick={() => handleViewPDF(partition)} className="p-2 rounded-full text-outline-variant hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group" title="Voir">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => handleDownload(partition)} className="p-2 rounded-full text-outline-variant hover:bg-green-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors group" title="Télécharger">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                          </>
                        ) : !hasAccess(partition) && partition.storage_path ? (
                          <div className="p-2 text-gray-300 dark:text-on-surface-variant" title="Accès restreint">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </div>
                        ) : null}
                        {partition.created_by === currentUser.id && (
                          <button onClick={() => handleDelete(partition.id)} className="p-2 rounded-full text-outline-variant hover:bg-red-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors group" title="Supprimer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vue Liste */}
          {viewMode === 'list' && (
            <div className="bg-surface-container-lowest shadow-ambient rounded-xl shadow-ambient  overflow-hidden animate-fade-in">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAndFilteredPartitions.map((partition) => (
                  <div key={partition.id} className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-on-primary text-sm font-semibold shadow-ambient">
                        {partition.user?.email?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-md font-semibold text-on-surface font-display truncate">{partition.title}</p>
                        <p className="text-sm text-outline-variant truncate">{partition.composer || 'Compositeur inconnu'}</p>
                      </div>
                      <button
                        onClick={() => handleToggleFavorite(partition.id)}
                        disabled={isTogglingFavorite === partition.id}
                        className={`p-2 rounded-full transition-all ${partition.isFavorite
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'text-outline-variant hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                      >
                        <svg className={`w-5 h-5 ${partition.isFavorite ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="hidden md:flex items-center gap-4 mx-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeClass(partition.category)}`}>
                        {partition.category}
                      </span>
                      {partition.messePart && (
                        <span className="text-sm text-outline-variant">{partition.messePart}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {partition.storage_path && (
                        <>
                          <button onClick={() => handleViewPDF(partition)} className="p-2 rounded-full text-outline-variant hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Voir"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button onClick={() => handleDownload(partition)} className="p-2 rounded-full text-outline-variant hover:bg-green-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Télécharger"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                        </>
                      )}
                      {partition.created_by === currentUser.id && (
                        <button onClick={() => handleDelete(partition.id)} className="p-2 rounded-full text-outline-variant hover:bg-red-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Supprimer"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-on-surface-variant">
            {sortedAndFilteredPartitions.length} partition{sortedAndFilteredPartitions.length > 1 ? 's' : ''} affichée{sortedAndFilteredPartitions.length > 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* PDF Viewer Modal */}
      {viewingPDF && (
        <PDFViewer url={viewingPDF} onClose={() => setViewingPDF(null)} />
      )}
    </div>
  );
};

export default Library;