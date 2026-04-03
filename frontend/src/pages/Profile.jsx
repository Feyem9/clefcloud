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
    totalViews: 42, // Mock for visual
    totalFavorites: 0,
    recentUploads: [],
    purchases: []
  });

  const [notificationSettings, setNotificationSettings] = useState({
    sharedManuscripts: true,
    communityComments: true,
    platformUpdates: false
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
          totalDownloads: Number(profileData.totalDownloads || 0).toLocaleString('en-US', { notation: 'compact' }),
          totalViews: (profileData.totalViews || 1250).toLocaleString('en-US', { notation: 'compact' }),
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
    <div className="min-h-screen bg-[#0a0a0a] text-white py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Avatar Box */}
            <div className="relative group">
              <div className="w-48 h-48 bg-[#1a1a1a] rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden relative">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black text-white/20 mb-2 tracking-[0.2em]">SAFFEE PIOFINE</p>
                    <svg className="w-24 h-24 text-white/10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <button className="absolute bottom-4 right-4 w-10 h-10 bg-[#fbc02d] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-4 border-[#1a1a1a]">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Details */}
            <div className="text-center md:text-left pt-2">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                <span className="bg-[#1a1a1a] text-[#a0a0a0] text-[10px] font-bold px-3 py-1.5 rounded-md tracking-widest uppercase border border-white/5">
                  PREMIUM MEMBER
                </span>
                <span className="text-[#606060] text-[10px] uppercase tracking-widest font-bold">
                  JOINED {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'OCT 2023'}
                </span>
              </div>
              <h1 className="text-7xl font-bold text-white mb-2 tracking-tight font-display">
                {userProfile?.name || currentUser?.displayName || 'Julian Vercetti'}
              </h1>
              <p className="text-xl text-[#a0a0a0] italic font-light tracking-wide">
                {userProfile?.title || 'Concertmaster & Digital Archivist'}
              </p>
            </div>
          </div>

          <div className="pt-10">
            <button className="bg-gradient-to-br from-[#5c6bc0] to-[#3949ab] text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_-10px_rgba(57,73,171,0.5)]">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* Partitions Card */}
          <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-10 border border-white/5 overflow-hidden group hover:border-white/10 transition-colors cursor-default">
            <div className="relative z-10">
              <p className="text-[#fbc02d] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">PARTITIONS UPLOADÉES</p>
              <div className="flex items-end gap-3">
                <span className="text-8xl font-bold leading-none tracking-tighter">{stats.totalPartitions || 142}</span>
                <span className="text-[#606060] text-lg mb-2 font-medium tracking-wide">manuscripts</span>
              </div>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </div>
          </div>

          {/* Lectures Card */}
          <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-10 border border-white/5 overflow-hidden group hover:border-white/10 transition-colors cursor-default">
            <div className="relative z-10">
              <p className="text-[#a0a0a0] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">LECTURES TOTALES</p>
              <div className="flex items-end gap-3">
                <span className="text-8xl font-bold leading-none tracking-tighter">{stats.totalViews || '3.8k'}</span>
                <span className="text-[#606060] text-lg mb-2 font-medium tracking-wide">rehearsals</span>
              </div>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
          </div>

          {/* Favoris Card */}
          <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-10 border border-white/5 overflow-hidden group hover:border-white/10 transition-colors cursor-default">
            <div className="relative z-10">
              <p className="text-[#a0a0a0] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">FAVORIS</p>
              <div className="flex items-end gap-3">
                <span className="text-8xl font-bold leading-none tracking-tighter">{stats.totalFavorites || 29}</span>
                <span className="text-[#606060] text-lg mb-2 font-medium tracking-wide">collections</span>
              </div>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Content Section */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Recent Activity */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bold tracking-tight">Recent Activity</h2>
              <button className="text-[#606060] text-[10px] uppercase tracking-widest font-bold border-b border-transparent hover:border-[#606060] transition-all">VIEW HISTORY</button>
            </div>

            <div className="space-y-4">
              {/* Activity Item 1 */}
              <div className="bg-[#1a1a1a]/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-[#2a2a2a] rounded-2xl flex items-center justify-center text-[#a0a0a0] group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Nocturne No. 2 in E-flat major</h3>
                    <p className="text-sm text-[#606060]">Uploaded to <span className="text-[#fbc02d]">Chopin Essentials</span></p>
                  </div>
                </div>
                <span className="text-[#606060] text-[10px] font-bold uppercase tracking-widest">2 HOURS AGO</span>
              </div>

              {/* Activity Item 2 */}
              <div className="bg-[#1a1a1a]/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-[#2a2a2a] rounded-2xl flex items-center justify-center text-[#a0a0a0] group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Practice Session: Bach Suite No. 1</h3>
                    <p className="text-sm text-[#606060]">Completed 45 minutes of rehearsal</p>
                  </div>
                </div>
                <span className="text-[#606060] text-[10px] font-bold uppercase tracking-widest text-right">YESTERDAY</span>
              </div>

              {/* Activity Item 3 */}
              <div className="bg-[#1a1a1a]/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-[#2a2a2a] rounded-2xl flex items-center justify-center text-[#a0a0a0] group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">New Favorite Added</h3>
                    <p className="text-sm text-[#606060]">Debussy - Clair de Lune (Annotated)</p>
                  </div>
                </div>
                <span className="text-[#606060] text-[10px] font-bold uppercase tracking-widest text-right">3 DAYS AGO</span>
              </div>
            </div>
          </div>

          {/* Right: Account Settings */}
          <div className="w-full lg:w-[420px]">
            <div className="bg-[#121212] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
              <h2 className="text-3xl font-bold mb-10 tracking-tight">Account Settings</h2>

              <div className="space-y-8">
                <div>
                  <label className="text-[#606060] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">EMAIL ADDRESS</label>
                  <div className="relative group">
                    <input
                      disabled
                      type="text"
                      value={currentUser?.email || "julian.vercetti@clefcloud.com"}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="text-[#606060] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">SECURITY</label>
                  <button className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-5 text-sm flex items-center justify-between group hover:border-white/20 transition-all">
                    <span className="text-[#e0e0e0]">Update Password</span>
                    <svg className="w-4 h-4 text-[#606060] group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div>
                  <label className="text-[#606060] text-[10px] font-bold uppercase tracking-[0.2em] mb-6 block">NOTIFICATION PREFERENCES</label>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-[#e0e0e0]">Shared Manuscripts</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md bg-[#0a0a0a] border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-[#e0e0e0]">Community Comments</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md bg-[#0a0a0a] border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-[#e0e0e0] opacity-50">Platform Updates</span>
                      <input type="checkbox" className="w-5 h-5 rounded-md bg-[#0a0a0a] border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-6">
                  <button className="w-full bg-[#2a2a2a] text-white py-5 rounded-2xl font-bold hover:bg-[#333] transition-colors shadow-lg">
                    Save All Changes
                  </button>
                  <button onClick={handleLogout} className="text-[#606060] text-[10px] font-bold uppercase tracking-[0.2em] hover:text-red-500 transition-colors text-center">
                    LOGOUT OF ALL SESSIONS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
