
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-blue-600 bg-opacity-5 dark:bg-primary-900 dark:bg-opacity-20 text-white rounded-2xl shadow-2xl p-12 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 drop-shadow-lg text-gray-900 dark:text-white">
            Bienvenue sur ClefCloud
          </h1>
          <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
            Votre bibliothèque de partitions musicales dans le cloud. 
            Accédez à vos partitions n'importe où, n'importe quand.
          </p>
          {!currentUser ? (
            <div className="flex gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 hover:scale-105 transition-all shadow-lg"
              >
                Commencer gratuitement
              </Link>
              <Link
                to="/login"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 hover:scale-105 transition-all border-2 border-white shadow-lg"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <Link
              to="/library"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-cyan-50 hover:scale-105 transition-all shadow-lg"
            >
              Accéder à ma bibliothèque
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
          Pourquoi ClefCloud ?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-cyan-50 dark:bg-gray-800 rounded-xl shadow-md p-8 text-center hover:shadow-xl hover:scale-105 transition-all border border-cyan-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Stockage Cloud
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Sauvegardez toutes vos partitions en toute sécurité dans le cloud. 
              Plus de risque de les perdre !
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-md p-8 text-center hover:shadow-xl hover:scale-105 transition-all border border-blue-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Accès Mobile
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Consultez vos partitions depuis n'importe quel appareil, 
              même en pleine messe sur votre smartphone.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-gray-800 rounded-xl shadow-md p-8 text-center hover:shadow-xl hover:scale-105 transition-all border border-green-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Organisation Simple
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Classez vos partitions par catégorie (messe, concert, autre) 
              et retrouvez-les facilement.
            </p>
          </div>
        </div>
      </div>

      {/* Messe Feature Highlight */}
      <div className="bg-yellow-50 dark:bg-gray-800 rounded-xl shadow-lg p-10 mb-12 border border-yellow-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">
              Spécial Messe
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Organisez vos partitions de messe par parties liturgiques : 
            Entrée, Kyrie, Gloria, Psaume, Alleluia, Offertoire, Sanctus, Agnus Dei, Communion, Sortie.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Sélectionnez rapidement la partie dont vous avez besoin et accédez instantanément 
            à toutes les partitions correspondantes. Idéal pour les pianistes et organistes !
          </p>
        </div>
      </div>

      {/* CTA Section */}
      {!currentUser && (
        <div className="bg-primary-100 dark:bg-gray-800 rounded-xl p-10 text-center shadow-lg border border-primary-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-primary-700 dark:text-primary-400 mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
            Créez votre compte gratuitement et commencez à sauvegarder vos partitions dès maintenant.
          </p>
          <Link
            to="/signup"
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 hover:scale-105 transition-all shadow-lg"
          >
            Créer mon compte
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
