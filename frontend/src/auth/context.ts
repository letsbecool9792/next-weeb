import { createContext } from 'react';
import type { UserData } from '../utils/auth';

/**
 * Whether someone is logged in, shared with every component.
 *
 * Before this, App kept an isLoggedIn flag and passed setIsLoggedIn down to
 * every page as a prop, and each page re-checked localStorage itself.
 */
export type AuthState = {
    isLoggedIn: boolean;
    user: UserData | null;
    /** Store the tokens from a finished MAL login */
    signIn: (access: string, refresh: string, user: UserData) => void;
    /** Revoke the session on the server and forget it locally */
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
