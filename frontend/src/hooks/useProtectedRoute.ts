import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const useProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated && !loading) {
            navigate("/login", { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    return isAuthenticated;
};