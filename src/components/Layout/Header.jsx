import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-2xl font-bold text-gray-800">ClefCloud</span>
          </Link>

          <div className="flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link to="/library" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Partitions
                </Link>
                <Link to="/messe" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Messe
                </Link>
                <Link to="/library" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Catégories
                </Link>
                <Link to="/upload" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Ajouter
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Contact
                </Link>
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:scale-110 transition-transform">
                      {currentUser.email?.[0].toUpperCase()}
                    </div>
                    <span className="text-gray-700 group-hover:text-purple-600 transition font-medium">
                      Profil
                    </span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link to="/contact" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Contact
                </Link>
                <Link to="/login" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-md"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
