/**
 * JWT Authentication utilities for managing tokens
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

export interface UserData {
    username: string;
    name: string;
    picture: string;
}

/**
 * Store JWT tokens and user data in localStorage
 */
export const setAuthTokens = (accessToken: string, refreshToken: string, userData: UserData) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    console.log('[Auth] Tokens and user data stored');
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Update only the access token (used after refresh)
 */
export const updateAccessToken = (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    console.log('[Auth] Access token updated');
};

/**
 * Get stored user data
 */
export const getUserData = (): UserData | null => {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    console.log('[Auth] Cleared all auth data');
};

/**
 * Check if user is authenticated (has access token)
 */
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};

/**
 * Get Authorization header with Bearer token
 */
export const getAuthHeader = (): { Authorization: string } | {} => {
    const token = getAccessToken();
    if (!token) return {};
    return {
        Authorization: `Bearer ${token}`,
    };
};
