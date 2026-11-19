import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth.js";

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <p className="loading-message">Checking authentication...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
