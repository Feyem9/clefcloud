import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

/**
 * Page Admin pour réinitialiser le mot de passe SANS code
 * ⚠️ DEV ONLY - À utiliser uniquement en développement
 */
const AdminResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }

    if (newPassword.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const response = await apiService.request('/auth/admin-reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword }),
        skipAuth: true,
      });

      setSuccess(`✅ Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.`);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la réinitialisation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'radial-gradient(circle, rgba(255, 177, 82, 0.15) 6.6%, rgba(242, 89, 138, 0.15) 50%, rgba(140, 72, 255, 0.15) 89.6%)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border-2 border-orange-300">
          {/* Warning Banner */}
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 text-orange-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-bold">⚠️ MODE DÉVELOPPEMENT</p>
                <p className="text-sm mt-1">Cette page permet de réinitialiser le mot de passe SANS code. À utiliser uniquement en développement.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-70 animate-pulse" style={{ background: 'radial-gradient(circle, #FFB152, #F2598A)' }}></div>
                <svg className="relative w-20 h-20" fill="none" stroke="url(#gradient-admin)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient-admin" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#FFB152' }} />
                      <stop offset="50%" style={{ stopColor: '#F2598A' }} />
                      <stop offset="100%" style={{ stopColor: '#8C48FF' }} />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h2 className="mt-8 text-center text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #FFB152, #F2598A, #8C48FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Admin Reset Password
            </h2>
            <p className="mt-3 text-center text-base text-gray-700">
              Réinitialiser directement sans code
            </p>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
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
                  className="appearance-none block w-full px-3 py-3 border-2 border-orange-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(255, 177, 82, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="votre@email.com"
                />
              </div>

              <div className="group">
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border-2 border-orange-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(255, 177, 82, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 8 caractères</p>
              </div>

              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border-2 border-orange-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(255, 177, 82, 0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #FFB152, #F2598A, #8C48FF)' }}
            >
              {loading ? '⚙️ Réinitialisation...' : '🔓 Réinitialiser (Admin)'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="font-semibold transition-all duration-200" style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ← Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
