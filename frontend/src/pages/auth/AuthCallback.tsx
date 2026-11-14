import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { useAuth } from '../../auth/useAuth';
import { takePendingLogin } from '../../utils/oauth';
import { motion } from 'motion/react';
import PosterWall from '../../components/ui/PosterWall';
import LoadingScreen from '../../components/LoadingScreen';

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

    return (
        <div className="page-bg relative overflow-hidden">
            <PosterWall className="opacity-20" />
            <div className="absolute inset-0 bg-ink/80" />
            <div className="relative">
                {error ? (
                    <div className="overlay-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card max-w-md border-rose-400/30 text-center"
                        >
                            <h1 className="mb-3 text-2xl font-bold text-rose-300">Login didn't work</h1>
                            <p className="text-purple-100/90">{error}</p>
                            <p className="mt-4 text-sm text-purple-300/70">Taking you back to the login page...</p>
                        </motion.div>
                    </div>
                ) : (
                    <LoadingScreen message="Logging you in..." subMessage="Fetching your MyAnimeList profile" />
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
