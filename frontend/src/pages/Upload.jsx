import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import { MESSE_PARTS } from '../constants';
import AudioPlayer from '../components/AudioPlayer';

const Upload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [filePreview, setFilePreview] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    composer: '',
    key: '',
    category: 'messe',
    messePart: '',
    tags: '',
  });

  const [file, setFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [lyricsFile, setLyricsFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Cleanup effect for preview URLs
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [audioPreviewUrl, coverPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFile = (file, types = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']) => {
    if (!types.includes(file.type)) {
      toast.error('Type de fichier non supporté.');
      return false;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (Max 15MB).');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      }
      toast.success(`📄 ${selectedFile.name} sélectionné`);
    }
  };

  const handleLyricsChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile, ['application/pdf'])) {
      setLyricsFile(selectedFile);
      toast.success(`📝 Paroles ${selectedFile.name} sélectionnées`);
    }
  };

  const handleCoverChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile, ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])) {
      setCoverFile(selectedFile);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(URL.createObjectURL(selectedFile));
      toast.success(`🖼️ Couverture ${selectedFile.name} sélectionnée`);
    }
  };
    const selectedAudio = e.target.files[0];
    if (selectedAudio) {
      if (selectedAudio.size > 20 * 1024 * 1024) {
        toast.error('Fichier audio trop volumineux (Max 20MB)');
        return;
      }
      setAudioFile(selectedAudio);

      // Create preview URL
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(URL.createObjectURL(selectedAudio));
      toast.success(`🎵 Audio ${selectedAudio.name} sélectionné`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file && !lyricsFile) {
      toast.error('Veuillez sélectionner au moins un PDF (partition ou paroles)');
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      const data = new FormData();
      if (file) data.append('pdf', file);
      if (lyricsFile) data.append('lyrics', lyricsFile);
      if (audioFile) data.append('audio', audioFile);
      if (coverFile) data.append('cover', coverFile);

      data.append('title', formData.title);
      data.append('composer', formData.composer);
      data.append('key', formData.key);
      data.append('category', formData.category);
      if (formData.category === 'messe') data.append('messePart', formData.messePart);
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
        data.append('tags', JSON.stringify(tagsArray));
      }

      await apiService.createPartition(data);

      toast.success('🎵 Partition et Audio ajoutés avec succès !');
      navigate('/library');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'upload. Vérifiez les fichiers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center bg-gray-50/50 dark:bg-gray-950/50">
      {/* Background Orbs pour effet WOW */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-3xl w-full mx-auto relative z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-ambient p-8 sm:p-12 border border-white/40 dark:border-gray-700/50">

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-orange-100 dark:from-primary-900/40 dark:to-orange-900/40 mb-5 shadow-inner border border-white/50 dark:border-gray-700">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-orange-500 mb-3 tracking-tight">
              Publier une œuvre
            </h1>
            <p className="text-outline-variant text-sm sm:text-base font-medium">
              Partagez vos partitions, enrichissez la bibliothèque universelle.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations de base */}
            <div className="bg-surface-container-high/50 rounded-2xl p-6 sm:p-8 /50 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 group">
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Titre de l'œuvre *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl  bg-surface-container-lowest shadow-ambient text-on-surface font-display focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient placeholder-gray-400"
                    placeholder="Ex: Ave Maria, Halleluya..." />
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Compositeur</label>
                  <input type="text" name="composer" value={formData.composer} onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl  bg-surface-container-lowest shadow-ambient text-on-surface font-display focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient placeholder-gray-400"
                    placeholder="Nom du compositeur" />
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">Catégorie</label>
                  <div className="relative">
                    <select name="category" value={formData.category} onChange={handleChange}
                      className="w-full px-5 py-3.5 rounded-xl  bg-surface-container-lowest shadow-ambient text-on-surface font-display focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all shadow-ambient appearance-none cursor-pointer">
                      <option value="messe">Messe</option>
                      <option value="concert">Concert</option>
                      <option value="autre">Autre</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-outline-variant">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Fichiers */}
            <div className="bg-surface-container-high/50 rounded-2xl p-6 sm:p-8 /50">
              <h3 className="text-lg font-bold text-on-surface font-display flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Fichiers joints
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zone de Drop PDF Partition */}
                <div className="relative group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-300 bg-white/50 dark:bg-gray-800/80 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-center overflow-hidden min-h-[160px]">
                  <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary-200 transition-all duration-300 mb-3 shadow-ambient">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-on-surface font-display">Partition (PDF/Img)</p>
                  <p className="text-xs text-outline-variant mt-1">Glissez ou cliquez</p>
                  {file && (
                    <div className="absolute inset-x-0 bottom-0 bg-primary-500/10 backdrop-blur-md p-2 border-t border-primary-500/20">
                      <p className="text-xs font-semibold text-primary-container dark:text-primary-300 truncate px-4 flex justify-center items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {file.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Zone de Drop PDF Paroles */}
                <div className="relative group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 bg-white/50 dark:bg-gray-800/80 hover:bg-green-50/50 dark:hover:bg-green-900/20 text-center overflow-hidden min-h-[160px]">
                  <input type="file" accept="application/pdf" onChange={handleLyricsChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300 mb-3 shadow-ambient">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-on-surface font-display">Paroles (PDF) <span className="text-outline-variant font-normal ml-1">Optionnel</span></p>
                  <p className="text-xs text-outline-variant mt-1">Glissez ou cliquez</p>
                  {lyricsFile && (
                    <div className="absolute inset-x-0 bottom-0 bg-green-500/10 backdrop-blur-md p-2 border-t border-green-500/20">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 truncate px-4 flex justify-center items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {lyricsFile.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Zone de Drop Audio */}
                <div className="relative group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-orange-500 dark:hover:border-orange-400 transition-all duration-300 bg-white/50 dark:bg-gray-800/80 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 text-center overflow-hidden min-h-[160px]">
                  <input type="file" accept="audio/*" onChange={handleAudioChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-200 transition-all duration-300 mb-3 shadow-ambient">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  <p className="text-sm font-bold text-on-surface font-display">Audio (MP3) <span className="text-outline-variant font-normal ml-1">Optionnel</span></p>
                  <p className="text-xs text-outline-variant mt-1">Glissez ou cliquez</p>
                  {audioFile && (
                    <div className="absolute inset-x-0 bottom-0 bg-orange-500/10 backdrop-blur-md p-2 border-t border-orange-500/20">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 truncate px-4 flex justify-center items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {audioFile.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Zone de Drop Image de couverture */}
                <div className="relative group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 bg-white/50 dark:bg-gray-800/80 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 text-center overflow-hidden min-h-[160px]">
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {coverPreview ? (
                    <img src={coverPreview} alt="Couverture" className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-2xl" />
                  ) : null}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-200 transition-all duration-300 mb-3 shadow-ambient">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm font-bold text-on-surface font-display">Couverture (Image) <span className="text-outline-variant font-normal ml-1">Optionnel</span></p>
                    <p className="text-xs text-outline-variant mt-1">Glissez ou cliquez</p>
                  </div>
                  {coverFile && (
                    <div className="absolute inset-x-0 bottom-0 bg-purple-500/10 backdrop-blur-md p-2 border-t border-purple-500/20 z-10">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 truncate px-4 flex justify-center items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {coverFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Note : au moins un PDF requis */}
              {!file && !lyricsFile && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Au moins un PDF (partition ou paroles) est requis
                </p>
              )}

              {/* Audio Preview en dessous de la grille s'il est chargé */}
              <div className="relative z-20">
                {audioPreviewUrl && (
                  <div className="mt-6 p-4 bg-surface-container-lowest shadow-ambient rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-ambient relative z-20">
                    <p className="text-xs text-orange-600 font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Aperçu Audio
                    </p>
                    <AudioPlayer src={audioPreviewUrl} />
                  </div>
                )}
              </div>
            </div>

            {/* Information de Prix */}
            <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center shadow-ambient">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-bold font-display uppercase tracking-wider">Prix de vente fixe</span>
                </div>
                <p className="text-3xl font-black text-amber-900 dark:text-amber-100 font-display">599 FCFA</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 max-w-md mx-auto italic">
                  Toutes les partitions chargées seront vendues à ce prix unique. Ce tarif inclut l'accès au PDF et au fichier audio si présent.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-primary-600 to-orange-500 text-on-primary font-bold py-4 sm:py-5 rounded-2xl shadow-ambient hover:shadow-primary-500/40 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-8">
              <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full"></div>
              <span className="relative flex items-center justify-center gap-2 text-lg">
                {loading ? (
                  <>
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Téléchargement en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Publier dans la bibliothèque
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
