import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFestival, setActiveFestivalState] = useState(null);
    const [activeEvent, setActiveEventState] = useState(null);
    const [verifiedEntity, setVerifiedEntityState] = useState(null);

    useEffect(() => {
        const initAuth = () => {
            try {
                const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const storedFest = localStorage.getItem('activeFestival');
                const storedEvt = localStorage.getItem('activeEvent');

                if (storedUser && token && storedUser !== 'undefined' && storedUser !== 'null') {
                    setUser(JSON.parse(storedUser));
                }
                if (storedFest && storedFest !== 'undefined' && storedFest !== 'null') {
                    setActiveFestivalState(JSON.parse(storedFest));
                }
                if (storedEvt && storedEvt !== 'undefined' && storedEvt !== 'null') {
                    setActiveEventState(JSON.parse(storedEvt));
                }
                const storedEntity = localStorage.getItem('verifiedEntity');
                if (storedEntity && storedEntity !== 'undefined' && storedEntity !== 'null') {
                    setVerifiedEntityState(JSON.parse(storedEntity));
                }
            } catch (error) {
                console.error('Error parsing auth data:', error);
                localStorage.clear();
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    console.warn('Unauthorized access, logging out');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    localStorage.removeItem('activeFestival');
                    localStorage.removeItem('activeEvent');
                    localStorage.removeItem('verifiedEntity');
                    setUser(null);
                    setActiveFestivalState(null);
                    setActiveEventState(null);
                    setVerifiedEntityState(null);
                    window.location.href = '/';
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const setActiveFestival = (fest) => {
        if (fest) localStorage.setItem('activeFestival', JSON.stringify(fest));
        else localStorage.removeItem('activeFestival');
        setActiveFestivalState(fest);
    };

    const setActiveEvent = (evt) => {
        if (evt) localStorage.setItem('activeEvent', JSON.stringify(evt));
        else localStorage.removeItem('activeEvent');
        setActiveEventState(evt);
    };

    const setVerifiedEntity = (entity) => {
        if (entity) localStorage.setItem('verifiedEntity', JSON.stringify(entity));
        else localStorage.removeItem('verifiedEntity');
        setVerifiedEntityState(entity);
    };

    const login = (userData, token, rememberMe = true) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', token || localStorage.getItem('token') || sessionStorage.getItem('token'));
        storage.setItem('user', JSON.stringify(userData));
        
        if (rememberMe) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        
        setUser(userData);
    };

    const switchRole = async (newRole) => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            await axios.post('/api/auth/switch-role', { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedUser = { ...user, role: newRole };
            
            if (sessionStorage.getItem('user')) {
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            setUser(updatedUser);
        } catch (err) {
            console.error('Failed to switch role in DB:', err);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('activeFestival');
        localStorage.removeItem('activeEvent');
        localStorage.removeItem('verifiedEntity');
        setUser(null);
        setActiveFestivalState(null);
        setActiveEventState(null);
        setVerifiedEntityState(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            loading,
            activeFestival,
            setActiveFestival,
            activeEvent,
            setActiveEvent,
            verifiedEntity,
            setVerifiedEntity,
            switchRole
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
