import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const Home = () => {
  const { currentUser } = useAuth();
  const [aboutUs, setAboutUs] = useState('Chargement...');
  const [testimonials, setTestimonials] = useState([]);
  const [userTestimony, setUserTestimony] = useState('');
  const [submittingTestimony, setSubmittingTestimony] = useState(false);
  const [testimonySubmitted, setTestimonySubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutData, testimonialsData] = await Promise.all([
          apiService.getSiteContent('about_us').catch(() => ({ content: '' })),
          apiService.getTestimonials().catch(() => [])
        ]);
        setAboutUs(aboutData.content || "Chorale spécialisée dans les œuvres liturgiques, partageant notre amour de la musique.");
        setTestimonials(testimonialsData || []);
      } catch (error) {
        console.error('Erreur lors du chargement de la page d\'accueil:', error);
      }
    };
    fetchData();
  }, []);

  const handleTestimonySubmit = async (e) => {
    e.preventDefault();
    if (!userTestimony.trim()) return;
    setSubmittingTestimony(true);
    try {
      await apiService.submitTestimonial({ content: userTestimony, rating: 5 });
      setTestimonySubmitted(true);
      setUserTestimony('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTestimony(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-low border border-white/10 shadow-ambient p-12 mb-12">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 drop-shadow-ambient text-on-surface font-display">
            Bienvenue sur ClefCloud
          </h1>
          <p className="text-xl mb-8 text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            La bibliothèque numérique de référence pour vos partitions.
            Profitez de notre <span className="text-primary font-bold">abonnement premium illimité</span> ou achetez vos morceaux à l'unité pour seulement <span className="text-tertiary font-bold">599 FCFA</span>.
          </p>
          {!currentUser ? (
            <div className="flex gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-bold hover:bg-primary-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Commencer l'aventure
              </Link>
              <Link
                to="/login"
                className="bg-surface-container-highest text-on-surface px-10 py-4 rounded-2xl font-bold hover:bg-surface-container-low hover:scale-[1.02] active:scale-95 transition-all border border-white/10"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <Link
              to="/library"
              className="inline-block bg-primary text-on-primary px-10 py-4 rounded-2xl font-bold hover:bg-primary-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Accéder à ma bibliothèque
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-on-surface font-display text-center mb-10">
          Pourquoi ClefCloud ?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-10 text-center hover:scale-[1.02] transition-all group">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-on-surface font-display mb-3">
              Stockage Cloud
            </h3>
            <p className="text-on-surface-variant">
              Sauvegardez toutes vos partitions en toute sécurité dans le cloud.
              Plus de risque de les perdre !
            </p>
          </div>

          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-10 text-center hover:scale-[1.02] transition-all group">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-on-surface font-display mb-3">
              Accès Mobile
            </h3>
            <p className="text-on-surface-variant">
              Consultez vos partitions depuis n'importe quel appareil,
              même en pleine messe sur votre smartphone.
            </p>
          </div>

          <div className="bg-surface-container-low backdrop-blur-xl rounded-3xl shadow-ambient border border-white/5 p-10 text-center hover:scale-[1.02] transition-all group">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-on-surface font-display mb-3">
              Organisation Simple
            </h3>
            <p className="text-on-surface-variant">
              Classez vos partitions par catégorie (messe, concert, autre)
              et retrouvez-les facilement.
            </p>
          </div>
        </div>
      </div>

      {/* Messe Feature Highlight */}
      <div className="bg-surface-container-high rounded-xl shadow-ambient p-10 mb-12 ">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center shadow-ambient">
              <svg className="w-6 h-6 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-tertiary">
              Spécial Messe
            </h2>
          </div>
          <p className="text-on-surface-variant mb-4 leading-relaxed">
            Organisez vos partitions de messe par parties liturgiques :
            Entrée, Kyrie, Gloria, Psaume, Alleluia, Offertoire, Sanctus, Agnus Dei, Communion, Sortie.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            Sélectionnez rapidement la partie dont vous avez besoin et accédez instantanément
            à toutes les partitions correspondantes. Idéal pour les pianistes et organistes !
          </p>
        </div>
      </div>

      {/* Premium Section */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-ambient p-10 mb-12 ">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full text-amber-700 dark:text-amber-400 text-sm font-semibold mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            ClefCloud Premium
          </div>
          <h2 className="text-3xl font-bold text-on-surface font-display mb-4">
            Accédez à toutes les partitions
          </h2>
          <p className="text-on-surface-variant mb-8 text-lg leading-relaxed">
            Avec Premium, débloquez l'accès illimité à toute la bibliothèque,
            ou achetez vos partitions préférées à l'unité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/premium"
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-on-primary px-8 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-600 hover:scale-105 transition-all shadow-ambient"
            >
              🚀 Découvrir Premium — 5 000 FCFA/mois
            </Link>
          </div>
        </div>
      </div>
      {/* About Us Section */}
      <div id="about" className="bg-surface-container-low rounded-xl shadow-ambient p-10 mb-12 border border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-on-surface font-display mb-6">
            À propos de nous
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">
            {aboutUs}
          </p>
        </div>
      </div>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <div id="testimonials" className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface font-display text-center mb-10">
            Ce que disent nos membres
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testy) => (
              <div key={testy.id} className="bg-surface-container-high p-8 rounded-2xl shadow-ambient relative">
                <div className="text-primary text-4xl leading-none absolute top-4 left-6 opacity-30">"</div>
                <p className="text-on-surface-variant italic mb-6 relative z-10 pt-4">
                  {testy.content}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                    {testy.user?.avatar_url ? (
                      <img src={apiService.getAvatarUrl(testy.user.avatar_url)} alt="avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : testy.user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{testy.user?.name || 'Utilisateur'}</h4>
                    <div className="flex text-yellow-500 text-xs">
                      {[...Array(testy.rating || 5)].map((_, i) => <span key={i}>⭐</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!currentUser && (
        <div className="bg-surface-container-low rounded-xl p-10 text-center shadow-ambient ">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-on-surface-variant mb-6 text-lg">
            Créez votre compte et accédez à tout notre catalogue premium dès aujourd'hui.
          </p>
          <Link
            to="/signup"
            className="bg-amber-500 text-on-primary px-8 py-3 rounded-xl font-semibold hover:bg-amber-600 hover:scale-105 transition-all shadow-ambient"
          >
            Créer mon compte
          </Link>
        </div>
      )}

      {/* Give Testimony Block */}
      {currentUser && (
        <div className="max-w-xl mx-auto bg-surface-container-low rounded-3xl shadow-ambient p-10 text-center mt-6 mb-12 border border-white/5">
          {!testimonySubmitted ? (
            <form onSubmit={handleTestimonySubmit}>
              <h3 className="text-2xl font-bold font-display text-primary mb-4">Donnez votre avis</h3>
              <p className="text-on-surface-variant mb-6">Votre avis compte beaucoup pour nous ! Partagez votre expérience avec la communauté.</p>
              <textarea
                required
                value={userTestimony}
                onChange={(e) => setUserTestimony(e.target.value)}
                className="w-full px-5 py-4 rounded-xl mb-4 bg-surface-container-highest shadow-ambient text-on-surface focus:ring-4 focus:ring-primary-500/20 focus:border-primary border-transparent outline-none transition-all placeholder-gray-400 resize-none h-32"
                placeholder="Que pensez-vous de ClefCloud ?"
              ></textarea>
              <button
                type="submit"
                disabled={submittingTestimony}
                className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:bg-primary-600 hover:scale-[1.02] active:scale-95 transition-all w-full disabled:opacity-50"
              >
                {submittingTestimony ? 'Envoi...' : 'Envoyer mon témoignage'}
              </button>
            </form>
          ) : (
            <div className="py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex justify-center items-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold font-display text-on-surface mb-2">Merci pour votre retour !</h3>
              <p className="text-on-surface-variant">Votre témoignage a été envoyé et sera examiné par l'équipe.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Home;
