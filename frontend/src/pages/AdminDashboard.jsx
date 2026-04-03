import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { currentUser, isAdmin } = useAuth();
    const [aboutUs, setAboutUs] = useState('');
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [aboutData, testimonialsData] = await Promise.all([
                apiService.getSiteContent('about_us').catch(() => ({ content: '' })),
                apiService.getAdminTestimonials().catch(() => [])
            ]);
            setAboutUs(aboutData.content || '');
            setTestimonials(testimonialsData || []);
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
            </div>
        </div>
    );
};

export default AdminDashboard;
