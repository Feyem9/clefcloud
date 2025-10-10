import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

const Library = () => {
  const { currentUser } = useAuth();
  const [partitions, setPartitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [messePartFilter, setMessePartFilter] = useState('all');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'partitions'),
      where('createdBy', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partitionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPartitions(partitionsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette partition ?')) {
      try {
        await deleteDoc(doc(db, 'partitions', id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la partition');
      }
    }
  };

  const filteredPartitions = partitions.filter(partition => {
    const matchesSearch = partition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (partition.composer && partition.composer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || partition.category === categoryFilter;
    const matchesMessePart = messePartFilter === 'all' || partition.messePart === messePartFilter;
    
    return matchesSearch && matchesCategory && matchesMessePart;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ma Bibliothèque</h1>
        <Link
          to="/upload"
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une partition
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Titre, compositeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes</option>
              <option value="messe">Messe</option>
              <option value="concert">Concert</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {categoryFilter === 'messe' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partie de la messe
              </label>
              <select
                value={messePartFilter}
                onChange={(e) => setMessePartFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toutes</option>
                <option value="Entrée">Entrée</option>
                <option value="Kyrie">Kyrie</option>
                <option value="Gloria">Gloria</option>
                <option value="Psaume">Psaume</option>
                <option value="Alleluia">Alleluia</option>
                <option value="Offertoire">Offertoire</option>
                <option value="Sanctus">Sanctus</option>
                <option value="Agnus Dei">Agnus Dei</option>
                <option value="Communion">Communion</option>
                <option value="Sortie">Sortie</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Liste des partitions */}
      {filteredPartitions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune partition trouvée</h3>
          <p className="text-gray-500 mb-6">
            {partitions.length === 0 
              ? "Commencez par ajouter votre première partition"
              : "Aucune partition ne correspond à vos critères de recherche"
            }
          </p>
          {partitions.length === 0 && (
            <Link
              to="/upload"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Ajouter une partition
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartitions.map((partition) => (
            <div key={partition.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {partition.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    partition.category === 'messe' ? 'bg-blue-100 text-blue-800' :
                    partition.category === 'concert' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {partition.category}
                  </span>
                </div>

                {partition.composer && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Compositeur:</span> {partition.composer}
                  </p>
                )}

                {partition.key && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Tonalité:</span> {partition.key}
                  </p>
                )}

                {partition.messePart && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Partie:</span> {partition.messePart}
                  </p>
                )}

                {partition.tags && partition.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {partition.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <a
                    href={partition.downloadURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-primary-600 text-white text-center py-2 rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    Ouvrir
                  </a>
                  <button
                    onClick={() => handleDelete(partition.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-gray-600">
        {filteredPartitions.length} partition{filteredPartitions.length > 1 ? 's' : ''} trouvée{filteredPartitions.length > 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default Library;
