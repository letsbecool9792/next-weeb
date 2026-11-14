/**
 * MyAnimeList login, browser side.
 *
 * Before sending the user to MAL this tab generates two random values and
 * keeps them in sessionStorage, which belongs to this tab only:
 *
 *  - verifier: MAL will only hand out a token for the returned code if the
 *    same verifier is presented again (PKCE). A code stolen on its way back
 *    is useless without it.
 *  - state: MAL echoes it back unchanged. If the value that comes back is not
 *    the one this tab stored, the response belongs to a login this tab never
 *    started, and we refuse it.
 */
import { API_URL } from '../config';

const VERIFIER_KEY = 'mal_oauth_verifier';
const STATE_KEY = 'mal_oauth_state';

export type OAuthConfig = {
    authorize_url: string;
    client_id: string;
    redirect_uri: string;
};

/** Random URL-safe string from the browser's cryptographic generator. */
const randomString = (byteCount: number): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

/** Ask the backend for the public MAL client id and redirect URI. */
export const fetchOAuthConfig = async (): Promise<OAuthConfig> => {
    const res = await fetch(`${API_URL}/api/oauth-config/`);
    if (!res.ok) {
        throw new Error(`Could not load login configuration (HTTP ${res.status})`);
    }
    return res.json();
};

/** Remember a fresh verifier and state, then send the browser to MAL. */
export const startMalLogin = (config: OAuthConfig) => {
    const verifier = randomString(64); // 86 characters; MAL accepts 43 to 128
    const state = randomString(32);

    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.client_id,
        redirect_uri: config.redirect_uri,
        // MAL only supports the "plain" method, where the challenge is the verifier itself.
        code_challenge: verifier,
        code_challenge_method: 'plain',
        state,
    });

    window.location.href = `${config.authorize_url}?${params.toString()}`;
};

/** Read the stored verifier and state once, removing them so they cannot be reused. */
export const takePendingLogin = () => {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const state = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return { verifier, state };
};
