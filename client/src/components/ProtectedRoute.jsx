import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, skipClubCheck = false, skipEntityCheck = false }) => {
    const { isAuthenticated, user, loading, verifiedEntity } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-slate-900">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const hasEntity = isAdmin ? verifiedEntity : (user?.entityName || verifiedEntity);

    // Force entity verification/selection before accessing any organizational features
    if (!hasEntity && !skipClubCheck && !skipEntityCheck) { 
        return <Navigate to="/verify-entity" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
