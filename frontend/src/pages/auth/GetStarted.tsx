import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, BarChart2, List } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '../../auth/useAuth';
import { fetchOAuthConfig, startMalLogin, type OAuthConfig } from '../../utils/oauth';

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

    const features = [
    {
        icon: <Zap className="text-white" />,
        title: "Personalized Recommendations",
        description: "Get anime suggestions that actually match your taste"
    },
    {
        icon: <BarChart2 className="text-white" />,
        title: "Taste Analyzer",
        description: "See what genres and studios you gravitate towards"
    },
    {
        icon: <List className="text-white" />,
        title: "Plan to Watch, Ranked",
        description: "Know which show on your Plan to Watch to start next"
    }
    ];

    if (isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center text-white">
            <div className="bg-purple-800 bg-opacity-30 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-8 max-w-md w-full shadow-lg">
                <div className="text-center">
                <h1 className="text-2xl font-bold">You're already logged in!</h1>
                <p className="mt-2 text-purple-200">Your anime journey awaits.</p>
                <Link
                    to="/dashboard"
                    className="mt-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 py-3 rounded-full font-medium inline-flex items-center justify-center"
                >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                </div>
            </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white p-4">
        <div className="max-w-4xl mx-auto pt-16 pb-20">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Connect Your MAL Account</h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            We use your MAL history to give you smarter recommendations, breakdowns, and insights. 
            NextWeeb only reads your list. It never changes anything on MyAnimeList.
            </p>
        </div>
        
        {malExpired && (
            <div className="bg-yellow-500/10 border border-yellow-400/40 text-yellow-100 rounded-xl p-4 mb-6 text-center">
                Your MyAnimeList connection expired. Log in again to reconnect it.
            </div>
        )}

        <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-8 mb-12">
            <div className="flex flex-col items-center">
            <div className="mb-6">
                <Shield className="h-12 w-12 text-purple-300" />
            </div>
            <p className="text-center mb-8 text-purple-200">
                You log in on MyAnimeList's own page, so your password never reaches us.
                NextWeeb only reads your list and profile; it never edits them.
            </p>
            <button
                onClick={handleMALLogin}
                disabled={isStartingLogin}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-8 py-4 rounded-full font-medium text-lg flex items-center disabled:opacity-60"
            >
                {isStartingLogin ? 'Connecting...' : 'Login with MyAnimeList'}
                <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            {loginError && (
                <p className="mt-4 text-red-300">{loginError}</p>
            )}
            </div>
        </div>
        
        <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Unlock These Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
                <div key={index} className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-purple-200">{feature.description}</p>
                </div>
            ))}
            </div>
        </div>
        
        <div className="text-center text-purple-300">
            <p className="font-medium">Built by a weeb, for weebs</p>
            <p className="mt-1 text-sm">No ads, no data selling, just better anime recommendations</p>
        </div>
        </div>
    </div>
    );
};

export default GetStarted;