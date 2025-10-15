import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../supabase/config';

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

const Upload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError('Type de fichier non supporté. Utilisez PDF, PNG ou JPG.');
        return;
      }
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Maximum 10MB.');
        return;
      }
      setFormData(prev => ({ ...prev, file }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (formData.category === 'messe' && !formData.messePart) {
      setError('Veuillez sélectionner une partie de la messe');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🚀 Début de l\'upload...');
      console.log('📄 Fichier:', formData.file.name, 'Taille:', formData.file.size);
      
      // Upload du fichier vers Supabase Storage (sans authentification - bucket public)
      const fileExtension = formData.file.name.split('.').pop();
      
      // Nettoyer le nom du fichier : enlever les caractères spéciaux
      const cleanTitle = formData.title
        .normalize('NFD') // Décomposer les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/[^a-zA-Z0-9\s]/g, '') // Enlever les caractères spéciaux
        .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
        .toLowerCase(); // Mettre en minuscules
      
      const fileName = `${Date.now()}_${cleanTitle}.${fileExtension}`;
      const filePath = `${currentUser.uid}/${fileName}`;
      
      console.log('📝 Nom nettoyé:', fileName);
      console.log('📂 Chemin:', filePath);
      
      // Créer un client Supabase anonyme pour upload public
      const { createClient } = await import('@supabase/supabase-js');
      const supabasePublic = createClient(
        'https://moiojsgocanyxxvrmcnz.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaW9qc2dvY2FueXh4dnJtY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODg0NzgsImV4cCI6MjA3NTY2NDQ3OH0.aOt1rqJVO_xg17LR_DrkuVO5WiFFngy_KeHAcC9qakw',
        {
          auth: {
            persistSession: false
          }
        }
      );
      
      console.log('☁️ Upload vers Supabase...');
      const { data: uploadData, error: uploadError } = await supabasePublic.storage
        .from('Partitions')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erreur Supabase:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Upload réussi!');

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('Partitions')
        .getPublicUrl(filePath);
      
      const downloadURL = publicUrl;

      // Créer le document dans Firestore
      const partitionData = {
        title: formData.title,
        composer: formData.composer || null,
        key: formData.key || null,
        category: formData.category,
        messePart: formData.category === 'messe' ? formData.messePart : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        storagePath: `partitions/${currentUser.uid}/${fileName}`,
        downloadURL: downloadURL,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'partitions'), partitionData);

      setSuccess('Partition ajoutée avec succès !');
      
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
      
      setError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ajouter une partition</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre de la partition *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: classique, liturgique, noël"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Fichier de la partition * (PDF, PNG, JPG - Max 10MB)
            </label>
            <input
              type="file"
              id="file"
              name="file"
              required
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              capture="environment"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {formData.file && (
              <p className="mt-2 text-sm text-green-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ajout en cours...' : 'Ajouter la partition'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
