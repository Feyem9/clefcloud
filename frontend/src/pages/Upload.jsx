import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import { MESSE_PARTS } from '../constants';

const Upload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [filePreview, setFilePreview] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Veuillez sélectionner au moins une partition (PDF/Image)');
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      const data = new FormData();
      data.append('pdf', file);
      if (audioFile) data.append('audio', audioFile);

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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 bg-gradient-to-r from-primary-600 to-orange-500 bg-clip-text text-transparent">
          Ajouter une partition
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Ex: Ave Maria" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Compositeur</label>
              <input type="text" name="composer" value={formData.composer} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                <option value="messe">Messe</option>
                <option value="concert">Concert</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Section Fichiers */}
          <div className="space-y-4 pt-4">
            <div className="p-6 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-2xl bg-primary-50/30 dark:bg-primary-900/10">
              <label className="block text-sm font-bold text-primary-800 dark:text-primary-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Fichier Partition (PDF/Image) *
              </label>
              <input type="file" accept="application/pdf,image/*" required onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 cursor-pointer" />
              {file && <p className="mt-2 text-xs text-green-600 font-medium">✓ {file.name}</p>}
            </div>

            <div className="p-6 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-2xl bg-orange-50/30 dark:bg-orange-900/10">
              <label className="block text-sm font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                Fichier Audio (MP3) - Optionnel
              </label>
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer" />
              {audioFile && <p className="mt-2 text-xs text-orange-600 font-medium">✓ {audioFile.name}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary-600 to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 mt-4">
            {loading ? 'Téléchargement...' : 'Ajouter à ma bibliothèque'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
