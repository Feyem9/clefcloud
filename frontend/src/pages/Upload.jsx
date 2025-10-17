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
    file: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez PDF, PNG ou JPG.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux. Maximum 10MB.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setFormData(prev => ({ ...prev, file }));
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
      toast.success(`📄 ${file.name} sélectionné`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setFormData(prev => ({ ...prev, file }));
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
      toast.success(`📄 ${file.name} ajouté`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (formData.category === 'messe' && !formData.messePart) {
      toast.error('Veuillez sélectionner une partie de la messe');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Début de l\'upload vers AWS S3...');
      console.log('📄 Fichier:', formData.file.name, 'Taille:', formData.file.size);
      
      // Préparer les données du formulaire
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('composer', formData.composer || '');
      uploadFormData.append('key', formData.key || '');
      uploadFormData.append('category', formData.category);
      
      if (formData.category === 'messe' && formData.messePart) {
        uploadFormData.append('messePart', formData.messePart);
      }
      
      if (formData.tags) {
        // Convertir la string en array (séparé par virgules)
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        uploadFormData.append('tags', JSON.stringify(tagsArray));
      }
      
      console.log('☁️ Upload vers le backend AWS...');
      
      // Envoyer au backend qui va uploader vers S3
      const result = await apiService.uploadPartition(uploadFormData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });
      
      console.log('✅ Upload réussi!', result);

      toast.success('🎵 Partition ajoutée avec succès !', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        composer: '',
        key: '',
        category: 'messe',
        messePart: '',
        tags: '',
        file: null
      });
      setFilePreview(null);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/library');
      }, 2000);

    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de l\'ajout de la partition. ';
      
      if (err.message) {
        errorMessage += err.message;
      } else if (err.error) {
        errorMessage += err.error;
      } else {
        errorMessage += 'Vérifiez votre connexion et réessayez.';
      }
      
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ajouter une partition</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la partition *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Ave Maria"
            />
          </div>

          <div>
            <label htmlFor="composer" className="block text-sm font-medium text-gray-700 mb-1">
              Compositeur
            </label>
            <input
              type="text"
              id="composer"
              name="composer"
              value={formData.composer}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Schubert"
            />
          </div>

          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
              Tonalité
            </label>
            <input
              type="text"
              id="key"
              name="key"
              value={formData.key}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Do majeur, Ré mineur"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="messe">Messe</option>
              <option value="concert">Concert</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {formData.category === 'messe' && (
            <div>
              <label htmlFor="messePart" className="block text-sm font-medium text-gray-700 mb-1">
                Partie de la messe *
              </label>
              <select
                id="messePart"
                name="messePart"
                required
                value={formData.messePart}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sélectionnez une partie</option>
                {MESSE_PARTS.map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: classique, liturgique, noël"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fichier de la partition * (PDF, PNG, JPG - Max 10MB)
            </label>
            
            {/* Zone de drag & drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-primary-400'
              }`}
            >
              <input
                type="file"
                id="file"
                name="file"
                ref={fileInputRef}
                required
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!formData.file ? (
                <label htmlFor="file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                      isDragging ? 'bg-primary-500' : 'bg-primary-100'
                    }`}>
                      <svg className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ou <span className="text-primary-600 font-medium">cliquez pour parcourir</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PDF, PNG, JPG • Max 10MB</p>
                  </div>
                </label>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{formData.file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <label 
                    htmlFor="file" 
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer underline"
                  >
                    Changer de fichier
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? `Ajout en cours... ${uploadProgress > 0 ? uploadProgress + '%' : ''}` : 'Ajouter la partition'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
