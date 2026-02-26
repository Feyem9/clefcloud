import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const Premium = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!currentUser) {
            toast.info('Connectez-vous pour souscrire à Premium');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.checkoutPremium();
            // PayUnit retourne une URL de paiement
            if (response.transaction_url) {
                window.location.href = response.transaction_url;
            } else {
                toast.error('Erreur lors de l\'initialisation du paiement');
            }
        } catch (error) {
            console.error('Erreur checkout premium:', error);
            toast.error('Impossible d\'initier le paiement. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ),
            title: 'Accès illimité',
            description: 'Consultez et téléchargez toutes les partitions de la bibliothèque sans restriction.',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            ),
            title: 'Téléchargements illimités',
            description: 'Téléchargez les partitions en PDF et les fichiers audio sans limites.',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            title: 'Contenu exclusif',
            description: 'Accédez aux partitions premium réservées aux abonnés.',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            ),
            title: 'Audio haute qualité',
            description: 'Écoutez les accompagnements audio en qualité studio.',
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-12 mb-12 shadow-2xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        ClefCloud Premium
                    </div>

                    <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
                        Débloquez tout le potentiel de ClefCloud
                    </h1>
                    <p className="text-xl text-white/90 mb-8 leading-relaxed">
                        Accès illimité à toutes les partitions, téléchargements sans restriction
                        et contenu exclusif pour les musiciens passionnés.
                    </p>

                    {/* Pricing Card */}
                    <div className="inline-block bg-white rounded-2xl shadow-2xl p-8 text-left max-w-sm">
                        <div className="text-center mb-6">
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Abonnement mensuel</p>
                            <div className="flex items-baseline justify-center gap-1 mt-2">
                                <span className="text-5xl font-extrabold text-gray-900">5 000</span>
                                <span className="text-xl text-gray-500 font-medium">FCFA</span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">par mois</p>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 text-green-500">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 text-sm">{feature.title}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-4 px-6 rounded-xl hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Traitement...
                                </span>
                            ) : (
                                '🚀 Devenir Premium'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
                    Tout ce que Premium vous offre
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-gray-200 dark:border-gray-700 flex gap-5"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparaison Gratuit vs Premium */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                    Gratuit vs Premium
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Fonctionnalité</th>
                                <th className="py-3 px-4 text-center text-gray-600 dark:text-gray-400 font-medium">Gratuit</th>
                                <th className="py-3 px-4 text-center font-medium text-amber-600">Premium ⭐</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Upload de partitions</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Voir ses propres partitions</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Accès à toutes les partitions</td>
                                <td className="py-3 px-4 text-center text-red-400">✗</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Téléchargements illimités</td>
                                <td className="py-3 px-4 text-center text-red-400">✗</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Fichiers audio</td>
                                <td className="py-3 px-4 text-center text-red-400">✗</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Contenu exclusif</td>
                                <td className="py-3 px-4 text-center text-red-400">✗</td>
                                <td className="py-3 px-4 text-center text-green-500">✓</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Premium;
