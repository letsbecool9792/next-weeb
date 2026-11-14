/**
 * Authenticated fetch wrapper that automatically includes JWT token
 * and handles token refresh on 401 responses
 */
import { getAccessToken, getAuthHeader, getRefreshToken, updateTokens, clearAuth } from './auth';
import { API_URL } from '../config';

let refreshPromise: Promise<string | null> | null = null;

/**
 * Trade the refresh token for a new access token and a new refresh token.
 *
 * Refresh tokens work once: the backend blacklists each one as it is used.
 * So within this tab, concurrent 401s share one refresh request instead of
 * each spending the same token.
 */
const refreshAccessToken = (): Promise<string | null> => {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch(`${API_URL}/api/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                updateTokens(data.access, data.refresh);
                return data.access as string;
            }

            // Another tab may have refreshed at the same moment and already
            // spent the token we sent. If storage now holds a different refresh
            // token, that tab succeeded, and its access token is ours to use.
            if (getRefreshToken() !== refreshToken) {
                return getAccessToken();
            }

            return null;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Authenticated fetch with automatic token refresh on 401
 */
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...getAuthHeader(),
        },
    });

    // If 401 Unauthorized, try to refresh token and retry once
    if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newAccessToken}`,
                },
            });

            // If still 401 after refresh, logout
            if (response.status === 401) {
                clearAuth();
                window.location.href = '/get-started';
            }
        } else {
            // Refresh failed: the session is over (expired, revoked, or the account is gone)
            clearAuth();
            window.location.href = '/get-started';
        }
    }

    // 403 with this code means our login is fine but the backend can no longer
    // reach MyAnimeList for this user. Only a fresh MAL login can fix that.
    if (response.status === 403) {
        const body = await response.clone().json().catch(() => null);
        if (body?.code === 'mal_reauth_required') {
            clearAuth();
            window.location.href = '/get-started?reason=mal_expired';
        }
    }

    return response;
};

/**
 * End the session on the server too: the backend blacklists the refresh
 * token, so a copy of it (say, from another device or a leaked backup) can
 * no longer be used. Local tokens are cleared even if the server is unreachable.
 */
export const logout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        try {
            await fetch(`${API_URL}/api/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
                signal: AbortSignal.timeout(5000), // a sleeping backend must not block logout
            });
        } catch {
            // Server unreachable: the token still expires on its own
        }
    }
    clearAuth();
};
