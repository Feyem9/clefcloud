import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const { refreshUserStatus } = useAuth();
    const [status, setStatus] = useState('loading'); // loading, success, error

    useEffect(() => {
        // PayUnit redirige ici après le paiement
        const transactionId = searchParams.get('transaction_id');
        const paymentStatus = searchParams.get('status');

        if (paymentStatus === 'SUCCESS' || paymentStatus === 'COMPLETE') {
            setStatus('success');
        } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
            setStatus('error');
        } else {
            // Si pas de paramètres, on suppose que c'est un succès (retour normal)
            setStatus('success');
        }

        if (paymentStatus === 'SUCCESS' || paymentStatus === 'COMPLETE' || !paymentStatus) {
            refreshUserStatus(); // Mettre à jour le statut premium immédiatement
        }
    }, [searchParams, refreshUserStatus]);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full text-center">
                {status === 'success' ? (
                    <div className="bg-surface-container-lowest shadow-ambient rounded-2xl shadow-ambient p-10 ">
                        {/* Success Icon */}
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold text-on-surface font-display mb-3">
                            Paiement réussi ! 🎉
                        </h1>
                        <p className="text-on-surface-variant mb-8 leading-relaxed">
                            Merci pour votre achat. Votre accès a été activé avec succès.
                            Vous pouvez maintenant profiter de toutes les fonctionnalités.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/library"
                                className="bg-primary-600 text-on-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-ambient hover:shadow-ambient hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                Voir mes partitions
                            </Link>
                            <Link
                                to="/"
                                className="bg-surface-container-high text-on-surface-variant px-6 py-3 rounded-xl font-semibold hover:bg-surface-container-high dark:hover:bg-gray-600 transition-all"
                            >
                                Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-container-lowest shadow-ambient rounded-2xl shadow-ambient p-10 ">
                        {/* Error Icon */}
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold text-on-surface font-display mb-3">
                            Paiement échoué
                        </h1>
                        <p className="text-on-surface-variant mb-8 leading-relaxed">
                            Le paiement n'a pas pu être complété. Aucun montant n'a été débité.
                            Veuillez réessayer ou contacter le support.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/premium"
                                className="bg-amber-500 text-on-primary px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-ambient hover:shadow-ambient hover:scale-105"
                            >
                                Réessayer
                            </Link>
                            <Link
                                to="/contact"
                                className="bg-surface-container-high text-on-surface-variant px-6 py-3 rounded-xl font-semibold hover:bg-surface-container-high dark:hover:bg-gray-600 transition-all"
                            >
                                Contacter le support
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
