import {
    useEffect,
    useState,
} from "react";

import api from "../api/axios.js";
import AuthContext from "./authContext.js";

const getUser = (data) => (
    data.user ||
    data.data?.user ||
    data.data ||
    null
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/auth/me");
                setUser(getUser(response.data));
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    setUser(null);
                } else {
                    console.error("Authentication check failed:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password,
        });

        const token = response.data.token || response.data.data?.token;

        if (!token) {
            throw new Error("Login response does not contain a token");
        }

        localStorage.setItem("token", token);

        let currentUser = getUser(response.data);

        if (!currentUser) {
            const meResponse = await api.get("/auth/me");
            currentUser = getUser(meResponse.data);
        }

        setUser(currentUser);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: Boolean(user),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
