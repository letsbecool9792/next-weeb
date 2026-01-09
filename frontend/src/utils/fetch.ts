/**
 * Authenticated fetch wrapper that automatically includes JWT token
 * and handles token refresh on 401 responses
 */
import { getAuthHeader, getRefreshToken, updateAccessToken, clearAuth } from './auth';
import { API_URL } from '../config';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
    // If already refreshing, return the existing promise
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const refreshToken = getRefreshToken();
            
            if (!refreshToken) {
                console.error('[Auth] No refresh token available');
                return null;
            }

            console.log('[Auth] Refreshing access token...');
            
            const response = await fetch(`${API_URL}/api/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) {
                console.error('[Auth] Token refresh failed:', response.status);
                return null;
            }

            const data = await response.json();
            const newAccessToken = data.access;

            if (newAccessToken) {
                updateAccessToken(newAccessToken);
                console.log('[Auth] Access token refreshed successfully');
                return newAccessToken;
            }

            return null;
        } catch (error) {
            console.error('[Auth] Token refresh error:', error);
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Authenticated fetch with automatic token refresh on 401
 */
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // First attempt with current token
    let headers = {
        ...options.headers,
        ...getAuthHeader(),
    };

    let response = await fetch(url, {
        ...options,
        headers,
    });

    // If 401 Unauthorized, try to refresh token and retry once
    if (response.status === 401) {
        console.log('[Auth] Got 401, attempting token refresh...');
        console.log('[Auth] Original request URL:', url);
        
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
            // Retry the request with new token
            console.log('[Auth] Retrying request with new token...');
            
            // Create fresh headers with new token
            headers = {
                ...options.headers,
                'Authorization': `Bearer ${newAccessToken}`,
            };

            console.log('[Auth] Retry headers include Authorization:', 'Authorization' in headers);

            response = await fetch(url, {
                ...options,
                headers,
            });

            console.log('[Auth] Retry response status:', response.status);

            // If still 401 after refresh, logout
            if (response.status === 401) {
                console.error('[Auth] Still unauthorized after token refresh, logging out...');
                clearAuth();
                window.location.href = '/get-started';
            }
        } else {
            // Refresh failed, logout
            console.error('[Auth] Token refresh failed, logging out...');
            clearAuth();
            window.location.href = '/get-started';
        }
    }

    return response;
};
