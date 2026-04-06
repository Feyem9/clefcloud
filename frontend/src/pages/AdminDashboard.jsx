import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { currentUser, isAdmin } = useAuth();
    const [aboutUs, setAboutUs] = useState('');
    const [testimonials, setTestimonials] = useState([]);
    const [adminTransactions, setAdminTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unlockingId, setUnlockingId] = useState(null);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [aboutData, testimonialsData, transactionsData] = await Promise.all([
                apiService.getSiteContent('about_us').catch(() => ({ content: '' })),
                apiService.getAdminTestimonials().catch(() => []),
                apiService.getAdminTransactions().catch(() => [])
            ]);
            setAboutUs(aboutData.content || '');
            setTestimonials(testimonialsData || []);
            setAdminTransactions(transactionsData || []);
        } catch (error) {
            console.error(error);
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAboutUs = async (e) => {
        e.preventDefault();
        try {
            await apiService.updateSiteContent('about_us', { content: aboutUs });
            toast.success('Texte mis à jour avec succès');
        } catch (err) {
            toast.error('Erreur de mise à jour');
        }
    };

    const toggleTestimonial = async (id, currentStatus) => {
        try {
            await apiService.updateTestimonialStatus(id, !currentStatus);
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, is_published: !currentStatus } : t));
            toast.success(`Témoignage ${!currentStatus ? 'publié' : 'masqué'}`);
        } catch (err) {
            toast.error('Erreur lors de la modification');
        }
    };

    const deleteTestimonial = async (id) => {
        if (!window.confirm("Supprimer ce témoignage ?")) return;
        try {
            await apiService.deleteTestimonial(id);
            setTestimonials(testimonials.filter(t => t.id !== id));
            toast.success('Témoignage supprimé');
        } catch (err) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleForceUnlock = async (id) => {
        if (!window.confirm(`Voulez-vous forcer le déblocage de la transaction #${id} ? Assurez-vous que le client a bien payé.`)) return;

        try {
            setUnlockingId(id);
            const result = await apiService.forceUnlockTransaction(id);
            if (result.success) {
                toast.success(result.message);
                await fetchAdminData(); // Rafraîchir la liste
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Erreur lors du déblocage forcé');
        } finally {
            setUnlockingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'success':
                return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-lg text-xs font-bold">SUCCESS</span>;
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold">PENDING</span>;
            case 'failed':
                return <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-lg text-xs font-bold">FAILED</span>;
            case 'expired':
                return <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded-lg text-xs font-bold">EXPIRED</span>;
            default:
                return <span className="px-2 py-1 bg-surface-container-highest rounded-lg text-xs">{status}</span>;
        }
    };

    if (!isAdmin) return <div>Accès refusé</div>;

    return (
        <div className="animate-fade-in max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold text-on-surface font-display mb-10">
                Tableau de bord administrateur
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section About Us */}
                <div className="bg-surface-container-low rounded-xl shadow-ambient p-8 border border-white/5">
                    <h2 className="text-2xl font-bold text-primary mb-6">Éditer "À propos"</h2>
                    <form onSubmit={handleUpdateAboutUs}>
                        <textarea
                            value={aboutUs}
                            onChange={(e) => setAboutUs(e.target.value)}
                            className="w-full h-48 px-5 py-4 rounded-xl bg-surface-container-highest shadow-ambient text-on-surface focus:ring-2 focus:ring-primary outline-none resize-none mb-6"
                            placeholder="Texte de la section À propos..."
                        ></textarea>
                        <button
                            type="submit"
                            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:bg-primary-600 transition-all w-full"
                        >
                            Enregistrer les modifications
                        </button>
                    </form>
                </div>

                {/* Section Témoignages */}
                <div className="bg-surface-container-low rounded-xl shadow-ambient p-8 border border-white/5">
                    <h2 className="text-2xl font-bold text-orange-500 mb-6 flex items-center gap-2">
                        Gestion des témoignages
                        <span className="bg-orange-500/20 text-orange-500 text-sm px-3 py-1 rounded-full">{testimonials.length}</span>
                    </h2>
                    {loading ? (
                        <div className="animate-pulse flex flex-col gap-4">
                            <div className="h-20 bg-surface-container-high rounded-xl"></div>
                            <div className="h-20 bg-surface-container-high rounded-xl"></div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {testimonials.map(t => (
                                <div key={t.id} className="p-4 bg-surface-container-highest rounded-xl border border-white/5 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-on-surface">{t.user?.name || t.user?.email}</p>
                                            <div className="flex text-yellow-500 text-xs">
                                                {[...Array(t.rating || 5)].map((_, i) => <span key={i}>⭐</span>)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleTestimonial(t.id, t.is_published)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${t.is_published ? 'bg-green-500/20 text-green-600 hover:bg-green-500/40' : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/40'}`}
                                            >
                                                {t.is_published ? 'Publié' : 'Masqué'}
                                            </button>
                                            <button
                                                onClick={() => deleteTestimonial(t.id)}
                                                className="p-1 px-2 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/30 rounded-lg"
                                            >
                                                Mettre à la corbeille
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-on-surface-variant italic text-sm line-clamp-3 hover:line-clamp-none">
                                        "{t.content}"
                                    </p>
                                </div>
                            ))}
                            {testimonials.length === 0 && (
                                <p className="text-outline-variant text-center py-10">Aucun témoignage pour le moment.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Section Transactions */}
                <div className="bg-surface-container-low rounded-xl shadow-ambient p-8 border border-white/5 lg:col-span-2">
                    <h2 className="text-2xl font-bold text-blue-500 mb-6 flex items-center gap-2">
                        Historique des Transactions (PayUnit)
                        <span className="bg-blue-500/20 text-blue-500 text-sm px-3 py-1 rounded-full">{adminTransactions.length}</span>
                    </h2>

                    {loading ? (
                        <div className="animate-pulse h-32 bg-surface-container-high rounded-xl"></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="text-outline-variant uppercase bg-surface-container-highest/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">ID</th>
                                        <th className="px-4 py-3">Réf PayUnit</th>
                                        <th className="px-4 py-3">Utilisateur</th>
                                        <th className="px-4 py-3">Montant</th>
                                        <th className="px-4 py-3">Statut</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminTransactions.map((t) => (
                                        <tr key={t.id} className="border-b border-white/5 hover:bg-surface-container-highest/30 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold">{t.id}</td>
                                            <td className="px-4 py-3 font-mono text-outline-variant">{t.payunit_transaction_id || '-'}</td>
                                            <td className="px-4 py-3">{t.user?.email}</td>
                                            <td className="px-4 py-3 font-bold">{t.amount} FCFA</td>
                                            <td className="px-4 py-3">{getStatusBadge(t.status)}</td>
                                            <td className="px-4 py-3 text-outline-variant">
                                                {new Date(t.created_at).toLocaleString('fr-FR', {
                                                    day: '2-digit', month: '2-digit', year: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {(t.status === 'pending' || t.status === 'failed' || t.status === 'expired') && (
                                                    <button
                                                        onClick={() => handleForceUnlock(t.id)}
                                                        disabled={unlockingId === t.id}
                                                        className="px-3 py-1 text-xs font-bold rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/40 transition-colors disabled:opacity-50"
                                                    >
                                                        {unlockingId === t.id ? '...' : 'Forcer le déblocage'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {adminTransactions.length === 0 && (
                                <p className="text-center py-6 text-outline-variant">Aucune transaction trouvée.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
