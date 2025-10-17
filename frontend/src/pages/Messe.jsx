import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

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

const Messe = () => {
  const { currentUser } = useAuth();
  const [selectedPart, setSelectedPart] = useState('');
  const [partitions, setPartitions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !selectedPart) return;

    setLoading(true);

    const q = query(
      collection(db, 'partitions'),
      where('createdBy', '==', currentUser.uid),
      where('category', '==', 'messe'),
      where('messePart', '==', selectedPart)
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
  }, [currentUser, selectedPart]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Partitions de Messe</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionnez une partie de la messe
        </label>
        <select
          value={selectedPart}
          onChange={(e) => setSelectedPart(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
        >
          <option value="">-- Choisir une partie --</option>
          {MESSE_PARTS.map(part => (
            <option key={part} value={part}>{part}</option>
          ))}
        </select>
      </div>

      {selectedPart && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {selectedPart}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : partitions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune partition pour {selectedPart}
              </h3>
              <p className="text-gray-500">
                Ajoutez une partition pour cette partie de la messe
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partitions.map((partition) => (
                <div key={partition.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {partition.title}
                    </h3>

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

                    {partition.tags && partition.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {partition.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={partition.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-primary-600 text-white text-center py-2 rounded-lg hover:bg-primary-700 transition mt-4"
                    >
                      Ouvrir la partition
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedPart && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 text-lg">
            Sélectionnez une partie de la messe pour afficher les partitions correspondantes
          </p>
        </div>
      )}
    </div>
  );
};

export default Messe;
