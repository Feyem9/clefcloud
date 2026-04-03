import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const user = await loginWithGoogle();
      if (user) {
        const token = await user.getIdToken();
        const dbUser = await apiService.validateToken(token);
        if (dbUser?.is_admin) {
          navigate('/admin');
        } else {
          navigate('/library');
        }
      }
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(error.message || 'Échec de l\'inscription avec Google.');
      console.error("Google Auth Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }

    if (password.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (!phone.startsWith('+')) {
      return setError('Le numéro de téléphone doit commencer par + (ex: +237...)');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const user = await signup(email, password); // Note: Firebase Auth de base ne prend pas le téléphone, mais on valide le formulaire

      if (user) {
        const token = await user.getIdToken();
        const dbUser = await apiService.validateToken(token);

        if (dbUser?.is_admin) {
          setSuccess('Connexion admin réussie ! Redirection...');
          setTimeout(() => {
            navigate('/admin');
          }, 1000);
        } else {
          setSuccess('Inscription réussie ! Redirection vers les offres Premium...');
          setTimeout(() => {
            navigate('/premium');
          }, 2000);
        }
      }
    } catch (error) {
      setError(error.message || 'Échec de la création du compte. Email déjà utilisé ?');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'radial-gradient(circle, rgba(255, 177, 82, 0.15) 6.6%, rgba(242, 89, 138, 0.15) 50%, rgba(140, 72, 255, 0.15) 89.6%)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-ambient border-2 border-white/30">
          <div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-70 animate-pulse" style={{ background: 'radial-gradient(circle, #8C48FF, #F2598A)' }}></div>
                <svg className="relative w-20 h-20" fill="none" stroke="url(#gradient-signup)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient-signup" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#8C48FF' }} />
                      <stop offset="50%" style={{ stopColor: '#F2598A' }} />
                      <stop offset="100%" style={{ stopColor: '#FFB152' }} />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            <h2 className="mt-8 text-center text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Créer un compte
            </h2>
            <p className="mt-3 text-center text-base text-gray-700">
              Commencez à sauvegarder vos partitions
            </p>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-xl shadow-ambient">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-xl shadow-ambient">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="votre@email.com"
                />
              </div>

              <div className="group">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="+237683845543"
                />
                <p className="mt-1 text-xs text-outline-variant">Format international (ex: +237...)</p>
              </div>

              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-outline-variant">Minimum 8 caractères</p>
              </div>

              <div className="group">
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-on-primary disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] shadow-ambient hover:shadow-ambient"
              style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)' }}
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-outline-variant font-medium">Ou s'inscrire avec</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl shadow-ambient bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold transition-all duration-200" style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
