import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import PDFViewer from '../components/PDFViewer';
import PartitionCardSkeleton from '../components/PartitionCardSkeleton';
import { MESSE_PARTS } from '../constants';
import { toast } from 'react-toastify';

const Library = () => {
  const { currentUser } = useAuth();
  const [partitions, setPartitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [messePartFilter, setMessePartFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [viewingPDF, setViewingPDF] = useState(null);
  // Mémoriser la vue dans le localStorage
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('clefcloud_view_mode') || 'grid'
  );

  useEffect(() => {
    localStorage.setItem('clefcloud_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchPartitions = async () => {
      try {
        setLoading(true);
        const data = await apiService.getPartitions();
        setPartitions(data.partitions || []);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des partitions:', error);
        toast.error('Erreur lors du chargement des partitions');
      } finally {
        setLoading(false);
      }
    };

    fetchPartitions();
  }, [currentUser]);

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

  const sortedAndFilteredPartitions = partitions
    .filter(partition => {
      const matchesSearch = partition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partition.composer && partition.composer.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || partition.category === categoryFilter;
      const matchesMessePart = messePartFilter === 'all' || partition.messePart === messePartFilter;
      const matchesOwner = ownerFilter === 'all' || partition.created_by === currentUser.id;

      return matchesSearch && matchesCategory && matchesMessePart && matchesOwner;
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
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-8 animate-pulse"></div>
        <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6 animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bibliothèque de Partitions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {partitions.length} partition{partitions.length > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex gap-3">
          {/* Toggle View Mode */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
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
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
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
            className="bg-primary-600 text-black px-6 py-2 rounded-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Rechercher
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Titre, compositeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              👤 Propriétaire
            </label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="all">Toutes les partitions</option>
              <option value="mine">Mes partitions uniquement</option>
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ⛪ Partie de la messe
              </label>
              <select
                value={messePartFilter}
                onChange={(e) => setMessePartFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔄 Trier par
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="date_desc">Plus récents</option>
              <option value="title_asc">Titre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Indicateur de filtres actifs */}
        {(searchTerm || categoryFilter !== 'all' || ownerFilter !== 'all' || messePartFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtres actifs:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  Recherche: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {ownerFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  Mes partitions
                  <button onClick={() => setOwnerFilter('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {messePartFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium flex items-center gap-1">
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
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline ml-2"
              >
                Réinitialiser tout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des partitions */}
      {sortedAndFilteredPartitions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center transition-colors border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">
              Aucune partition trouvée
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {partitions.length === 0
                ? "Commencez par ajouter votre première partition à la bibliothèque"
                : "Aucune partition ne correspond à vos critères de recherche. Essayez de modifier les filtres."
              }
            </p>
            {partitions.length === 0 && (
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
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
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden group"
                >
                  {/* Header coloré */}
                  <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-600"></div>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Titre et catégorie */}
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {partition.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getCategoryBadgeClass(partition.category)}`}>
                        {partition.category}
                      </span>
                    </div>

                    {/* Informations */}
                    <div className="space-y-2 mb-4 flex-1">
                      {partition.composer && (
                        <div className="flex items-start gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">{partition.composer}</span>
                        </div>
                      )}

                      {partition.key && (
                        <div className="flex items-start gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">{partition.key}</span>
                        </div>
                      )}

                      {partition.messePart && (
                        <div className="flex items-start gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">{partition.messePart}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {partition.tags && partition.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {partition.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 ${getTagColor(index)} text-xs font-medium rounded-full border transition-all hover:scale-105 shadow-sm`}
                          >
                            #{tag}
                          </span>
                        ))}
                        {partition.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                            +{partition.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Propriétaire */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-blue-800 text-sm font-semibold shadow-md">
                        {partition.user?.email?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {partition.created_by === currentUser.id ? (
                            <span className="font-semibold text-primary-600 dark:text-primary-400">Vous</span>
                          ) : (
                            <span>{partition.user?.email || 'Utilisateur'}</span>
                          )}
                        </span>
                        <p className="text-xs text-gray-400">{new Date(partition.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Lecteur Audio */}
                    {partition.audio_url && (
                      <div className="mb-4">
                        <audio
                          controls
                          className="w-full h-8 accent-primary-600"
                          src={partition.audio_url}
                        >
                          Votre navigateur ne supporte pas l'élément audio.
                        </audio>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                      {partition.storage_path ? (
                        <>
                          <button onClick={() => handleViewPDF(partition)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group" title="Voir">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => handleDownload(partition)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors group" title="Télécharger">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                        </>
                      ) : null}
                      {partition.created_by === currentUser.id && (
                        <button onClick={() => handleDelete(partition.id)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors group" title="Supprimer">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vue Liste */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAndFilteredPartitions.map((partition) => (
                  <div key={partition.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {partition.user?.email?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-md font-semibold text-gray-900 dark:text-white truncate">{partition.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{partition.composer || 'Compositeur inconnu'}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 mx-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeClass(partition.category)}`}>
                        {partition.category}
                      </span>
                      {partition.messePart && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">{partition.messePart}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {partition.storage_path && (
                        <>
                          <button onClick={() => handleViewPDF(partition)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Voir"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button onClick={() => handleDownload(partition)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Télécharger"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                        </>
                      )}
                      {partition.created_by === currentUser.id && (
                        <button onClick={() => handleDelete(partition.id)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Supprimer"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
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