import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './context';
import { getUserData, isAuthenticated, setAuthTokens, type UserData } from '../utils/auth';
import { logout } from '../utils/fetch';

/**
 * Holds the login state for the whole app. The tokens themselves stay in
 * localStorage (utils/auth.ts); this mirrors "is there a session" into React
 * state so components re-render when it changes.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated);
    const [user, setUser] = useState<UserData | null>(getUserData);

    useEffect(() => {
        // Logging in or out in another tab changes localStorage there; follow it here.
        const onStorage = () => {
            setIsLoggedIn(isAuthenticated());
            setUser(getUserData());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const signIn = useCallback((access: string, refresh: string, userData: UserData) => {
        setAuthTokens(access, refresh, userData);
        setUser(userData);
        setIsLoggedIn(true);
    }, []);

    const signOut = useCallback(async () => {
        await logout();
        setUser(null);
        setIsLoggedIn(false);
    }, []);

    const value = useMemo(() => ({ isLoggedIn, user, signIn, signOut }), [isLoggedIn, user, signIn, signOut]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
