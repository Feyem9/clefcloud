import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Profile = () => {
  const { currentUser, logout, updateUserProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [partitions, setPartitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPartitions: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalFavorites: 0,
    recentUploads: [],
    purchases: []
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Récupérer le profil complet (avec stats et achats)
        const profileData = await apiService.getProfile();
        setUserProfile(profileData);
        setStats({
          totalPartitions: profileData.totalPartitions || 0,
          totalDownloads: profileData.totalDownloads || 0,
          totalViews: profileData.totalViews || 0,
          totalFavorites: profileData.totalFavorites || 0,
          recentUploads: profileData.recentUploads || [],
          purchases: profileData.purchases || []
        });
        setEditName(profileData.name || currentUser?.displayName || '');

        // Récupérer les partitions de l'utilisateur
        if (profileData.id) {
          const partitionsData = await apiService.getUserPartitions(profileData.id, 50, 0);
          setPartitions(partitionsData.partitions || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setError('');
      setLoading(true);
      await updateUserProfile(editName);
      setUserProfile({ ...userProfile, name: editName });
      setIsEditing(false);
    } catch (err) {
      setError('Erreur lors de la modification : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError('');
      setLoading(true);
      await deleteAccount();
      navigate('/');
    } catch (err) {
      setError('Erreur lors de la suppression : ' + err.message);
      setLoading(false);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête du profil */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="relative h-48 bg-primary-600">
            <div className="absolute inset-0 bg-green-600 rounded-t-2xl"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-32 h-32 bg-white rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}

                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      className="text-2xl font-bold text-gray-900 border-2 border-primary-300 rounded-lg px-3 py-1 bg-white/50 focus:outline-none focus:border-primary-500 w-full sm:w-80"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Votre nom"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleUpdateProfile} className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">Enregistrer</button>
                      <button onClick={() => { setIsEditing(false); setEditName(userProfile?.name || currentUser?.displayName || ''); }} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {userProfile?.name || currentUser?.displayName || 'Utilisateur'}
                    </h1>
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" title="Modifier le nom">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    {userProfile?.is_premium && (
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                        PREMIUM
                      </span>
                    )}
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {currentUser?.email}
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0 mt-4 sm:mt-0">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex justify-center items-center gap-2 border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>

                {isDeleting ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                    <p className="text-xs text-red-700 font-semibold text-center">Toutes vos données seront effacées. Sûr ?</p>
                    <div className="flex gap-2 justify-center">
                      <button onClick={handleDeleteAccount} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">Oui, supprimer</button>
                      <button onClick={() => setIsDeleting(false)} className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="px-6 py-2 border-2 border-red-100 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 hover:border-red-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer le compte
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Partitions</p>
                <p className="text-4xl font-bold text-primary-600 mt-2">
                  {stats.totalPartitions}
                </p>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Téléchargements</p>
                <p className="text-4xl font-bold text-cyan-600 mt-2">
                  {stats.totalDownloads}
                </p>
              </div>
              <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Vues</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {stats.totalViews}
                </p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Favoris</p>
                <p className="text-4xl font-bold text-yellow-600 mt-2">
                  {stats.totalFavorites}
                </p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Partitions récentes */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary-600">
              Partitions Récentes
            </h2>
            <button
              onClick={() => navigate('/library')}
              className="bg-green-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-50 hover:scale-105 hover:text-green-600 transition-all shadow-lgext-green-400 hover:scale-105 transition-all shadow-lg"
            >
              Voir tout
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {(!stats.recentUploads || stats.recentUploads.length === 0) ? (
            <div className="text-center py-12">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune partition</h3>
              <p className="text-gray-500 mb-6">Commencez par ajouter votre première partition</p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-green-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-50 hover:scale-105 hover:text-green-600 transition-all shadow-lgext-green-400 hover:scale-105 transition-all shadow-lg"
              >
                Ajouter une partition
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentUploads?.map((partition) => (
                <div
                  key={partition.id}
                  className="group bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-primary-300 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {partition.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {partition.composer && (
                            <p className="text-sm text-gray-600">
                              {partition.composer}
                            </p>
                          )}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${partition.category === 'messe' ? 'bg-blue-100 text-blue-700' :
                            partition.category === 'concert' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {partition.category}
                          </span>
                          {partition.messePart && (
                            <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg">
                              {partition.messePart}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {partition.downloadURL && partition.downloadURL.includes('supabase') ? (
                      <a
                        href={partition.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ouvrir
                      </a>
                    ) : (
                      <div className="px-5 py-2.5 bg-gray-400 text-white rounded-xl font-semibold cursor-not-allowed flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Non disponible
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Historique des achats */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-primary-600 mb-6 flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Mes Achats
          </h2>

          {(!stats.purchases || stats.purchases.length === 0) ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Vous n'avez pas encore effectué d'achat individuel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{purchase.title}</h3>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACHETÉ</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Le {new Date(purchase.purchased_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => navigate('/library')}
                    className="w-full py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
                  >
                    Ouvrir la partition
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
