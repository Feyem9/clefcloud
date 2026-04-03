import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { currentUser, isAdmin, isPremium, premiumUntil, logout, updateUserProfile, deleteAccount, refreshUserStatus } = useAuth();
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

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);
      const updated = await refreshUserStatus();
      if (updated) {
        toast.success('Statut mis à jour !');
        // Re-fetch profile data to sync stats
        const profileData = await apiService.getProfile();
        setUserProfile(profileData);
      }
    } catch (err) {
      toast.error('Erreur lors du rafraîchissement');
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Background Orbs pour effet WOW */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse pointer-events-none"></div>

        {/* En-tête du profil avec Carte de Membre */}
        <div className="relative mb-12">
          <div className="bg-surface-container-low backdrop-blur-3xl rounded-[3rem] shadow- ambient border border-white/10 overflow-hidden">
            <div className={`relative h-64 ${isPremium ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}>
              {/* Patterns de fond */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

              <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-50 ${isPremium ? 'bg-amber-400 animate-pulse' : 'bg-primary-300'}`}></div>
                    <div className={`relative w-40 h-40 rounded-full border-8 border-surface-container-low shadow-2xl flex items-center justify-center overflow-hidden bg-surface-container-lowest`}>
                      <span className={`text-6xl font-black font-display ${isPremium ? 'text-amber-500' : 'text-primary'}`}>
                        {currentUser?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    {isPremium && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg border-4 border-surface-container-low">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-black text-white font-display drop-shadow-lg">
                        {userProfile?.name || currentUser?.displayName || 'Utilisateur'}
                      </h1>
                      {isAdmin && <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/30 tracking-tighter uppercase">Admin</span>}
                    </div>
                    <p className="text-white/80 font-medium flex items-center gap-2 mt-1 drop-shadow-md">
                      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                {/* Status Card Overlay */}
                <div className="bg-white/10 backdrop-blur-2xl px-8 py-6 rounded-3xl border border-white/20 shadow-xl min-w-[280px]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">MEMBERSHIP</span>
                    {isPremium && <span className="text-amber-300 text-[10px] font-black tracking-widest">GOLD</span>}
                  </div>
                  <div className="mb-4">
                    <div className="text-2xl font-black text-white font-display">
                      {isPremium ? 'Membre Premium' : 'Utilisateur Free'}
                    </div>
                    <p className="text-white/60 text-xs mt-1">
                      {isPremium ? `Expire le ${new Date(premiumUntil).toLocaleDateString()}` : 'Accès limité aux partitions'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isPremium ? (
                      <button onClick={handleRefreshStatus} className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
                        Actualiser
                      </button>
                    ) : (
                      <button onClick={() => navigate('/premium')} className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg animate-bounce">
                        S'abonner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low px-10 py-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold text-sm transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Modifier le nom
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 text-on-surface-variant hover:text-red-500 font-bold text-sm transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Déconnexion
                </button>
              </div>

              {isDeleting ? (
                <div className="flex items-center gap-4 bg-red-500/10 px-4 py-2 rounded-2xl border border-red-500/20">
                  <span className="text-red-500 text-xs font-bold">Confirmer suppression ?</span>
                  <button onClick={handleDeleteAccount} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">OUI</button>
                  <button onClick={() => setIsDeleting(false)} className="text-outline-variant text-xs font-bold">NON</button>
                </div>
              ) : (
                <button onClick={() => setIsDeleting(true)} className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Supprimer mon compte</button>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-8 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Partitions</p>
                <p className="text-4xl font-bold text-on-surface mt-2 font-display">
                  {stats.totalPartitions}
                </p>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-8 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Téléchargements</p>
                <p className="text-4xl font-bold text-on-surface mt-2 font-display">
                  {stats.totalDownloads}
                </p>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-8 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Favoris</p>
                <p className="text-4xl font-bold text-on-surface mt-2 font-display">
                  {stats.totalFavorites}
                </p>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-8 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Achats</p>
                <p className="text-4xl font-bold text-on-surface mt-2 font-display">
                  {stats.purchases?.length || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Partitions récentes */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-ambient border border-white/20 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">
              Partitions Récentes
            </h2>
            <button
              onClick={() => navigate('/library')}
              className="bg-green-400 text-on-primary px-8 py-3 rounded-xl font-semibold hover:bg-green-50 hover:scale-105 hover:text-green-600 transition-all shadow-ambientext-green-400 hover:scale-105 transition-all shadow-ambient"
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
              <p className="text-outline-variant mb-6">Commencez par ajouter votre première partition</p>
              {isAdmin && (
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-primary text-on-primary px-8 py-4 rounded-3xl font-bold hover:bg-primary-600 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                  Ajouter une partition
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentUploads?.map((partition) => (
                <div
                  key={partition.id}
                  className="group bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-primary-300 transition-all duration-300 hover:shadow-ambient"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {partition.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {partition.composer && (
                            <p className="text-sm text-on-surface-variant">
                              {partition.composer}
                            </p>
                          )}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-xl ${partition.category === 'messe' ? 'bg-blue-100 text-blue-700' :
                            partition.category === 'concert' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {partition.category}
                          </span>
                          {partition.messePart && (
                            <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-xl">
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
                        className="px-5 py-2.5 bg-primary-600 text-on-primary rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 transform hover:scale-105 shadow-ambient flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ouvrir
                      </a>
                    ) : (
                      <div className="px-5 py-2.5 bg-gray-400 text-on-primary rounded-xl font-semibold cursor-not-allowed flex items-center gap-2">
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
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-ambient border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Mes Achats
          </h2>

          {(!stats.purchases || stats.purchases.length === 0) ? (
            <div className="text-center py-8 bg-surface-container-high/50 rounded-xl border border-dashed border-gray-300">
              <p className="text-outline-variant">Vous n'avez pas encore effectué d'achat individuel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white dark:bg-gray-700 rounded-xl p-4  shadow-ambient hover:shadow-ambient transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-on-surface font-display line-clamp-1">{purchase.title}</h3>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACHETÉ</span>
                  </div>
                  <p className="text-xs text-outline-variant mb-4">Le {new Date(purchase.purchased_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => navigate('/library')}
                    className="w-full py-2 bg-primary-50 text-primary-container rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors"
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
