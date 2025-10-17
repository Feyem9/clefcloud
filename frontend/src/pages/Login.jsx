import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendCode, setShowResendCode] = useState(false);
  const { login, resendConfirmationCode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/library');
      }
    } catch (error) {
      const errorMsg = error.message || 'Échec de la connexion. Vérifiez vos identifiants.';
      setError(errorMsg);
      
      // Si l'erreur mentionne la confirmation, afficher le bouton de renvoi
      if (errorMsg.includes('confirm') || errorMsg.includes('not confirmed')) {
        setShowResendCode(true);
      }
      
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Veuillez entrer votre email d\'abord');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await resendConfirmationCode(email);
      setSuccess('Code de confirmation renvoyé ! Vérifiez votre email.');
      setShowResendCode(false);
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  // Google login désactivé temporairement (non implémenté dans AWS Cognito)
  const handleGoogleLogin = async () => {
    setError('La connexion avec Google n\'est pas encore disponible. Utilisez votre email et mot de passe.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'radial-gradient(circle, rgba(255, 177, 82, 0.15) 6.6%, rgba(242, 89, 138, 0.15) 50%, rgba(140, 72, 255, 0.15) 89.6%)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border-2 border-white/30 transition-all duration-300 hover:shadow-3xl">
          <div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-70 animate-pulse" style={{ background: 'radial-gradient(circle, #8C48FF, #F2598A)' }}></div>
                <svg className="relative w-20 h-20" fill="none" stroke="url(#gradient)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
              Connexion
            </h2>
            <p className="mt-3 text-center text-base text-gray-600">
              Accédez à vos partitions musicales
            </p>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm animate-shake">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          {showResendCode && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-orange-300 rounded-xl text-orange-700 bg-orange-50 hover:bg-orange-100 font-semibold transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Renvoyer le code de confirmation
              </button>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                    onBlur={(e) => e.target.style.boxShadow = ''}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                    onBlur={(e) => e.target.style.boxShadow = ''}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Ou continuer avec</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="font-semibold transition-all duration-200" style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Inscrivez-vous
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link to="/forgot-password" className="font-semibold text-orange-600 hover:text-orange-700 transition-all duration-200">
                Mot de passe oublié ?
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Compte non confirmé ?{' '}
              <button
                type="button"
                onClick={() => setShowResendCode(true)}
                className="font-semibold text-orange-600 hover:text-orange-700 transition-all duration-200"
              >
                Renvoyer le code
              </button>
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                🔧 Dev:{' '}
                <Link to="/admin-reset-password" className="font-semibold text-orange-500 hover:text-orange-600 transition-all duration-200">
                  Reset sans code
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
