import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Zap, BarChart2, List, AlertTriangle } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '../../auth/useAuth';
import { fetchOAuthConfig, startMalLogin, type OAuthConfig } from '../../utils/oauth';
import PosterWall from '../../components/ui/PosterWall';
import Kanji from '../../components/ui/Kanji';
import Logo from '../../components/brand/Logo';

const FEATURES = [
    { icon: Zap, title: 'Personalized picks', description: 'Recommendations that say why they were chosen' },
    { icon: BarChart2, title: 'Taste analyzer', description: 'The genres and studios you gravitate towards' },
    { icon: List, title: 'Plan to Watch, ranked', description: 'Know which show to start next' },
];

const GetStarted = () => {
    const { isLoggedIn } = useAuth();
    const [isStartingLogin, setIsStartingLogin] = useState(false);
    const [loginError, setLoginError] = useState('');
    const configRequest = useRef<Promise<OAuthConfig | null> | null>(null);
    const posthog = usePostHog();

    // Set when the app sent the user here because their MyAnimeList connection ran out
    const malExpired = new URLSearchParams(window.location.search).get('reason') === 'mal_expired';

    useEffect(() => {
        // Ask for the login configuration as soon as the page opens. The backend
        // sleeps when idle, so this also wakes it up while the user is still reading.
        // A failure here is kept as null and retried when the button is clicked.
        configRequest.current = fetchOAuthConfig().catch(() => null);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            posthog?.capture('user_logged_in', { login_type: 'returning_session' });
        }
    }, [isLoggedIn, posthog]);

    const handleMALLogin = async () => {
        // Track MAL login button click
        posthog?.capture('mal_login_clicked');

        setIsStartingLogin(true);
        setLoginError('');

        try {
            // Use the request started on page load, or try again if that one failed
            const config = (await configRequest.current) ?? (await fetchOAuthConfig());
            startMalLogin(config); // leaves this page for myanimelist.net
        } catch {
            setLoginError('Could not reach the server. Please try again in a moment.');
            setIsStartingLogin(false);
        }
    };

    return (
        <div className="page-bg relative flex items-center justify-center overflow-hidden px-4 py-16">
            <PosterWall className="opacity-30" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(11_6_20/0.75)_0%,rgb(11_6_20/0.95)_65%)]" />

            <div className="absolute left-4 top-5 z-10 sm:left-8"><Logo /></div>
            {/* 入口: "entrance" */}
            <Kanji text="入口" className="-right-10 bottom-0 text-[18rem] opacity-70 sm:text-[26rem]" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-lg"
            >
                {isLoggedIn ? (
                    <div className="card p-10 text-center">
                        <h1 className="text-3xl font-bold">You're already logged in!</h1>
                        <p className="mt-2 text-purple-200/80">Your anime journey awaits.</p>
                        <Link to="/dashboard" className="btn-primary mt-8 px-8 py-3">
                            Go to Home <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="card p-8 sm:p-10">
                        <div className="text-center">
                            <motion.div
                                animate={{ rotate: [0, -6, 6, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                                className="icon mx-auto mb-6 h-16 w-16 rounded-2xl"
                            >
                                <Shield className="h-8 w-8" />
                            </motion.div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Connect your MAL account</h1>
                            <p className="mt-3 text-purple-200/80">
                                We use your MyAnimeList history for smarter recommendations, breakdowns and insights.
                            </p>
                        </div>

                        {malExpired && (
                            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                Your MyAnimeList connection expired. Log in again to reconnect it.
                            </div>
                        )}

                        <button onClick={handleMALLogin} disabled={isStartingLogin} className="btn-primary mt-8 w-full py-4 text-lg">
                            {isStartingLogin ? 'Connecting...' : 'Log in with MyAnimeList'}
                            <ArrowRight className="h-5 w-5" />
                        </button>
                        {loginError && <p className="mt-4 text-center text-sm text-rose-300">{loginError}</p>}

                        <p className="mt-5 text-center text-xs text-purple-300/70">
                            You log in on MyAnimeList's own page, so your password never reaches us.
                            NextWeeb only reads your list and profile; it never edits them.
                        </p>

                        <div className="mt-8 grid gap-3 border-t border-white/10 pt-6">
                            {FEATURES.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-pink-300">
                                        <f.icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold">{f.title}</p>
                                        <p className="text-xs text-purple-300/70">{f.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default GetStarted;
