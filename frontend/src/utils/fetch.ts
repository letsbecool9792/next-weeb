/**
 * Authenticated fetch wrapper that automatically includes JWT token
 */
import { getAuthHeader } from './auth';

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
        ...options.headers,
        ...getAuthHeader(),
    };

    return fetch(url, {
        ...options,
        headers,
    });
};
