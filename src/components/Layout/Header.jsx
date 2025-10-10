import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 z-50" onClick={closeMobileMenu}>
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-2xl font-bold text-gray-800">ClefCloud</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link to="/library" className="text-gray-700 hover:text-primary-600 transition font-medium">
                  Partitions
                </Link>
                <Link to="/messe" className="text-gray-700 hover:text-primary-600 transition font-medium">
                  Messe
                </Link>
                <Link to="/upload" className="text-gray-700 hover:text-primary-600 transition font-medium">
                  Ajouter
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition font-medium">
                  Contact
                </Link>
                <Link to="/profile" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:scale-110 transition-transform">
                    {currentUser.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-gray-700 group-hover:text-primary-600 transition font-medium">
                    Profil
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/contact" className="text-gray-700 hover:text-purple-600 transition font-medium">
                  Contact
                </Link>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition font-medium">
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-700 transition font-medium shadow-md"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden z-50 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileMenu}
        >
          <div
            className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="text-xl font-bold text-gray-800">Menu</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex-1 overflow-y-auto py-6">
                {currentUser ? (
                  <div className="space-y-2 px-4">
                    {/* Profile Section */}
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-all"
                    >
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {currentUser.email?.[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Mon Profil</p>
                        <p className="text-sm text-gray-600 truncate">{currentUser.email}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <div className="pt-4 space-y-1">
                      <Link
                        to="/library"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-primary-600 transition-colors">Partitions</span>
                      </Link>

                      <Link
                        to="/messe"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-primary-600 transition-colors">Messe</span>
                      </Link>

                      <Link
                        to="/upload"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-primary-600 transition-colors">Ajouter</span>
                      </Link>

                      <Link
                        to="/contact"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-gray-700 group-hover:text-primary-600 transition-colors">Contact</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 px-4">
                    <Link
                      to="/contact"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Contact</span>
                    </Link>

                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Connexion</span>
                    </Link>

                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center space-x-2 p-4 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-lg font-semibold"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Inscription</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Footer */}
              {currentUser && (
                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
