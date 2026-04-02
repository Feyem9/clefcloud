import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PremiumRoute = ({ children }) => {
    const { currentUser, isPremium, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Si pas connecté -> Vers Login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Si connecté mais pas Premium -> Vers Premium
    if (!isPremium) {
        return <Navigate to="/premium" replace />;
    }

    return children;
};

export default PremiumRoute;
