import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
    const [decodedToken, setDecodedToken] = useState(() => authToken ? jwtDecode(authToken) : null);
    const [logoutTimer, setLogoutTimer] = useState(null);
    const navigate = useNavigate();

    const setToken = (token) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        setDecodedToken(jwtDecode(token));
        resetLogoutTimer();
    };

    const resetLogoutTimer = () => {
        if (logoutTimer) {
            clearTimeout(logoutTimer);
        }
        const timer = setTimeout(() => {
            logout();
        }, 86400000); //24h
        setLogoutTimer(timer);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setDecodedToken(null);
        if (logoutTimer) {
            clearTimeout(logoutTimer);
        }
        navigate('/login', { replace: true });
    };

    useEffect(() => {
        resetLogoutTimer();
        return () => {
            if (logoutTimer) {
                clearTimeout(logoutTimer);
            }
        };
    }, [authToken]);

    return (
        <AuthContext.Provider value={{ authToken, decodedToken, setToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
