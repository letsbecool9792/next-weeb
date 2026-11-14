import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { useAuth } from '../../auth/useAuth';
import { takePendingLogin } from '../../utils/oauth';

const AuthCallback = () => {
    const { signIn } = useAuth();
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();
    const started = useRef(false);

    useEffect(() => {
        // In development React runs every effect twice. An OAuth code can only
        // be exchanged once, so the second run must do nothing.
        if (started.current) return;
        started.current = true;

        const finishLogin = async () => {
            // MAL sent the browser here with ?code=...&state=... (or ?error=...)
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const returnedState = params.get('state');
            const malError = params.get('error');

            // What this tab stored before it left for MAL
            const { verifier, state: expectedState } = takePendingLogin();

            // Take the one-time code out of the address bar and browser history
            window.history.replaceState({}, '', window.location.pathname);

            try {
                if (malError) {
                    throw new Error(
                        malError === 'access_denied'
                            ? 'You declined access on MyAnimeList.'
                            : `MyAnimeList returned an error: ${malError}`
                    );
                }
                if (!code) {
                    throw new Error('MyAnimeList did not return an authorization code.');
                }
                if (!verifier || !expectedState) {
                    throw new Error('No login was in progress in this tab. Please start again.');
                }
                if (returnedState !== expectedState) {
                    throw new Error('This login response does not match the one this tab started. Please try again.');
                }

                // The backend adds the client secret and trades code + verifier for our JWTs
                const res = await fetch(`${API_URL}/api/exchange-token/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, verifier }),
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to complete login');
                }

                const data = await res.json();

                // Store tokens and user data, and mark the app as logged in
                signIn(data.access, data.refresh, data.user);

                // replace: the Back button should not return to this page
                navigate('/dashboard', { replace: true });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Authentication failed');

                // Redirect to get-started page after 3 seconds
                setTimeout(() => {
                    navigate('/get-started', { replace: true });
                }, 3000);
            }
        };

        finishLogin();
    }, [navigate, signIn]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center text-white">
                <div className="bg-red-800 bg-opacity-30 backdrop-blur-sm border border-red-500 border-opacity-30 rounded-xl p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold text-red-300 mb-4">Authentication Error</h1>
                    <p className="text-red-200">{error}</p>
                    <p className="text-purple-200 mt-4">Redirecting to login page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-300 mx-auto"></div>
                <p className="mt-4 text-xl font-medium text-purple-300">Completing authentication...</p>
                <p className="mt-2 text-sm text-purple-400">Please wait while we log you in</p>
            </div>
        </div>
    );
};

export default AuthCallback;
