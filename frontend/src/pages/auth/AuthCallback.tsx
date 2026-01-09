import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { setAuthTokens } from '../../utils/auth';

const AuthCallback = ({ setIsLoggedIn }: { setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const exchangeToken = async () => {
            console.log('[AuthCallback] Starting token exchange');
            
            try {
                // Call backend to exchange OAuth code for JWT tokens
                const res = await fetch(`${API_URL}/api/exchange-token/`, {
                    method: 'POST',
                    credentials: 'include', // Send session cookie with OAuth code
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('[AuthCallback] Exchange response status:', res.status);

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error('[AuthCallback] Exchange failed:', errorData);
                    throw new Error(errorData.error || 'Failed to exchange token');
                }

                const data = await res.json();
                console.log('[AuthCallback] Tokens received:', { 
                    hasAccess: !!data.access, 
                    hasRefresh: !!data.refresh,
                    user: data.user?.username 
                });

                // Store tokens and user data in localStorage
                setAuthTokens(data.access, data.refresh, data.user);

                // Update logged-in state
                setIsLoggedIn(true);

                console.log('[AuthCallback] Auth successful, redirecting to dashboard');
                
                // Redirect to dashboard
                navigate('/dashboard');
            } catch (err: any) {
                console.error('[AuthCallback] Error:', err);
                setError(err.message || 'Authentication failed');
                
                // Redirect to get-started page after 3 seconds
                setTimeout(() => {
                    navigate('/get-started');
                }, 3000);
            }
        };

        exchangeToken();
    }, [navigate, setIsLoggedIn]);

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
