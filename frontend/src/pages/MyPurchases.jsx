import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const MyPurchases = () => {
    const { currentUser, refreshUserStatus } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);

    useEffect(() => {
        if (currentUser) {
            fetchTransactions();
        }
    }, [currentUser]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMyTransactions();
            setTransactions(data);
        } catch (error) {
            console.error(error);
            toast.error('Erreur lors du chargement de vos achats');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        try {
            setVerifyingId(id);
            const result = await apiService.verifyTransaction(id);

            if (result.success) {
                toast.success(result.message);
                await fetchTransactions();
                await refreshUserStatus(); // Mettre à jour l'accès premium ou bibliothèque
            } else {
                toast.warning(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erreur lors de la vérification');
        } finally {
            setVerifyingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'success':
                return <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold">✅ Réussi</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold">⏳ En attente</span>;
            case 'failed':
                return <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold">❌ Échoué</span>;
            case 'expired':
                return <span className="px-3 py-1 bg-gray-500/20 text-gray-500 rounded-full text-xs font-bold">⏱️ Expiré</span>;
            default:
                return <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs">{status}</span>;
        }
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-on-surface font-display mb-2">
                Mes Achats
            </h1>
            <p className="text-on-surface-variant mb-8">
                Consultez l'historique de vos transactions et l'état de vos déblocages.
            </p>

            <div className="bg-surface-container-low rounded-xl shadow-ambient border border-white/5 overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant">
                        <p>Vous n'avez pas encore effectué d'achats.</p>
                        <Link to="/library" className="mt-4 inline-block text-primary hover:underline font-bold">
                            Découvrir la bibliothèque
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.map(t => (
                            <div key={t.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-surface-container-highest transition-colors">
                                <div>
                                    <h3 className="font-bold text-on-surface text-lg">
                                        {t.type === 'premium' ? 'Abonnement Premium' : `Partition : ${t.partition?.title || 'Inconnue'}`}
                                    </h3>
                                    <p className="text-on-surface-variant text-sm">
                                        Réf: {t.id}-CLEFCLOUD • {t.amount} FCFA
                                    </p>
                                    <p className="text-xs text-outline-variant mt-1">
                                        Le {new Date(t.created_at).toLocaleDateString('fr-FR')} à {new Date(t.created_at).toLocaleTimeString('fr-FR')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                    {getStatusBadge(t.status)}

                                    {t.status.toLowerCase() === 'pending' && (
                                        <button
                                            onClick={() => handleVerify(t.id)}
                                            disabled={verifyingId === t.id}
                                            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary-600 transition-colors disabled:opacity-50"
                                        >
                                            {verifyingId === t.id ? 'Vérification...' : 'Vérifier l\'accès'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPurchases;
