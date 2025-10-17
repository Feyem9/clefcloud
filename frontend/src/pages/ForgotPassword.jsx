import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: demander code, 2: réinitialiser mot de passe
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await apiService.forgotPassword(email);
      setSuccess('Code de réinitialisation envoyé ! Vérifiez votre email.');
      setStep(2);
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'envoi du code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
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
      
      await apiService.confirmForgotPassword(email, code, newPassword);
      setSuccess('Mot de passe réinitialisé avec succès ! Redirection...');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      setError(error.message || 'Code invalide ou expiré');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'radial-gradient(circle, rgba(255, 177, 82, 0.15) 6.6%, rgba(242, 89, 138, 0.15) 50%, rgba(140, 72, 255, 0.15) 89.6%)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border-2 border-white/30">
          <div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-70 animate-pulse" style={{ background: 'radial-gradient(circle, #8C48FF, #F2598A)' }}></div>
                <svg className="relative w-20 h-20" fill="none" stroke="url(#gradient-forgot)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient-forgot" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#8C48FF' }} />
                      <stop offset="50%" style={{ stopColor: '#F2598A' }} />
                      <stop offset="100%" style={{ stopColor: '#FFB152' }} />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <h2 className="mt-8 text-center text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {step === 1 ? 'Mot de passe oublié ?' : 'Nouveau mot de passe'}
            </h2>
            <p className="mt-3 text-center text-base text-gray-700">
              {step === 1 ? 'Entrez votre email pour recevoir un code' : 'Entrez le code reçu et votre nouveau mot de passe'}
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

          {step === 1 ? (
            <form className="mt-8 space-y-5" onSubmit={handleRequestCode}>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)' }}
              >
                {loading ? 'Envoi...' : 'Envoyer le code'}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
              <div className="space-y-5">
                <div className="group">
                  <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                    Code de vérification
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
                    onBlur={(e) => e.target.style.boxShadow = ''}
                    placeholder="123456"
                  />
                  <p className="mt-1 text-xs text-gray-500">Vérifiez votre boîte email</p>
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
                    className="appearance-none block w-full px-3 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white"
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(140, 72, 255, 0.3)'}
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
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #8C48FF, #F2598A, #FFB152)' }}
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Vous vous souvenez de votre mot de passe ?{' '}
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

export default ForgotPassword;
