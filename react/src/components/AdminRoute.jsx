import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-10 h-10 border-4 border-white/20 border-t-violet-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (!isAdmin) return <Navigate to="/dashboard" state={{ forbidden: true }} replace />;

    return children;
};

export default AdminRoute;
