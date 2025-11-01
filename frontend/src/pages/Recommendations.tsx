import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Star, Building2, Gem, MessageCircle, Send, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { API_URL } from '../config';

// Helper function to get CSRF token from cookies
const getCsrfToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

type Anime = {
    id: number;
    title: string;
    image: string;
    score: number;
};

type BecauseYouLiked = {
    anchor: string;
    anime: Anime[];
};

type Recommendations = {
    because_you_liked: BecauseYouLiked[];
    from_genres: {
        genre: string;
        anime: Anime[];
    };
    from_studios: {
        studio: string;
        anime: Anime[];
    };
    hidden_gems: Anime[];
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const Recommendations = ({ setIsLoggedIn }: { setIsLoggedIn: any }) => {
    const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const loadRecommendations = async () => {
        const res = await fetch(`${API_URL}/api/recommendations/`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
            const data = await res.json();
            setRecommendations(data);
        }
        setLoading(false);
        setRegenerating(false);
    };

    useEffect(() => {
        loadRecommendations();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleRegenerate = () => {
        setRegenerating(true);
        loadRecommendations();
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || chatLoading) return;

        const userMessage = userInput.trim();
        setUserInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatLoading(true);

        try {
            // Prepare context for AI
            const context = [
                ...(recommendations?.because_you_liked.flatMap(byl => byl.anime) || []),
                ...(recommendations?.from_genres.anime || []),
                ...(recommendations?.hidden_gems || [])
            ].slice(0, 20);

            const suggestions = context.map(a => ({ title: a.title }));

            const csrfToken = getCsrfToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }

            const res = await fetch(`${API_URL}/api/ai-chat/`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({
                    message: userMessage,
                    context,
                    suggestions
                })
            });

            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            } else {
                setChatMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Sorry, I had trouble processing that. Please try again!' 
                }]);
            }
        } catch (error) {
            setChatMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Oops! Something went wrong. Please try again.' 
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-b from-gray-900 to-fuchsia-950">
                <LoadingScreen message="Analyzing your taste..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white">
            <Header setIsLoggedIn={setIsLoggedIn} />

            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
                        <Sparkles className="text-yellow-400" size={40} />
                        <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            Your Personalized Picks
                        </span>
                    </h1>
                    <p className="text-xl text-purple-300 max-w-2xl mx-auto">
                        Based on your unique taste, here's what you'll love next
                    </p>
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="btn-secondary gap-2 mt-4 mx-auto"
                    >
                        <RefreshCw className={regenerating ? 'animate-spin' : ''} size={20} />
                        {regenerating ? 'Refreshing...' : 'Regenerate'}
                    </button>
                </div>

                {/* Because You Liked Sections */}
                {recommendations?.because_you_liked.map((section, idx) => (
                    <div key={idx} className="card mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="text-pink-400" size={28} />
                            Because you liked <span className="text-purple-400">{section.anchor}</span>
                        </h2>
                        <div className="overflow-x-auto pb-4">
                            <div className="flex gap-4" style={{ width: 'max-content' }}>
                                {section.anime.map((anime) => (
                                    <Link
                                        key={anime.id}
                                        to={`/anime/${anime.id}`}
                                        className="flex-shrink-0 w-44 group"
                                    >
                                        <div className="relative overflow-hidden rounded-lg border-2 border-purple-500/30 group-hover:border-purple-500 transition-all">
                                            <img
                                                src={anime.image || '/placeholder.png'}
                                                alt={anime.title}
                                                className="w-full h-60 object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            {anime.score > 0 && (
                                                <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Star size={12} />
                                                    {anime.score.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                            {anime.title}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {/* From Your Favorite Genres */}
                {recommendations?.from_genres && recommendations.from_genres.anime.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Star className="text-purple-400" size={28} />
                            From Your Favorite Genre: <span className="text-pink-400">{recommendations.from_genres.genre}</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {recommendations.from_genres.anime.map((anime) => (
                                <Link
                                    key={anime.id}
                                    to={`/anime/${anime.id}`}
                                    className="group"
                                >
                                    <div className="relative overflow-hidden rounded-lg border-2 border-purple-500/30 group-hover:border-purple-500 transition-all">
                                        <img
                                            src={anime.image || '/placeholder.png'}
                                            alt={anime.title}
                                            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        {anime.score > 0 && (
                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Star size={12} />
                                                {anime.score.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {anime.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* From Your Favorite Studios */}
                {recommendations?.from_studios && recommendations.from_studios.anime.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Building2 className="text-blue-400" size={28} />
                            More from <span className="text-blue-400">{recommendations.from_studios.studio}</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {recommendations.from_studios.anime.map((anime) => (
                                <Link
                                    key={anime.id}
                                    to={`/anime/${anime.id}`}
                                    className="group"
                                >
                                    <div className="relative overflow-hidden rounded-lg border-2 border-purple-500/30 group-hover:border-purple-500 transition-all">
                                        <img
                                            src={anime.image || '/placeholder.png'}
                                            alt={anime.title}
                                            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        {anime.score > 0 && (
                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Star size={12} />
                                                {anime.score.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {anime.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hidden Gems */}
                {recommendations?.hidden_gems && recommendations.hidden_gems.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Gem className="text-emerald-400" size={28} />
                            Hidden Gems You'll Love
                        </h2>
                        <p className="text-purple-300 mb-4">Highly-rated but underrated anime in your favorite genres</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {recommendations.hidden_gems.map((anime) => (
                                <Link
                                    key={anime.id}
                                    to={`/anime/${anime.id}`}
                                    className="group"
                                >
                                    <div className="relative overflow-hidden rounded-lg border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-all">
                                        <img
                                            src={anime.image || '/placeholder.png'}
                                            alt={anime.title}
                                            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-400 to-emerald-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Gem size={12} />
                                            Hidden
                                        </div>
                                        {anime.score > 0 && (
                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Star size={12} />
                                                {anime.score.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {anime.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Chat Assistant */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <MessageCircle className="text-pink-400" size={28} />
                        Ask Our AI Assistant
                    </h2>
                    <p className="text-purple-300 mb-6">
                        Want something specific? Ask me and I'll help you find the perfect anime from our recommendations!
                    </p>

                    {/* Chat Messages */}
                    <div className="bg-purple-900/30 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                        {chatMessages.length === 0 ? (
                            <div className="text-center text-purple-400 py-8">
                                <p className="mb-4">Try asking:</p>
                                <div className="space-y-2 text-sm">
                                    <p className="bg-purple-800/50 rounded-lg p-2">"Give me something short and wholesome"</p>
                                    <p className="bg-purple-800/50 rounded-lg p-2">"What should I watch if I liked Steins;Gate?"</p>
                                    <p className="bg-purple-800/50 rounded-lg p-2">"Recommend me something dark and psychological"</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${
                                            msg.role === 'user' 
                                                ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                                                : 'bg-purple-800/50'
                                        }`}>
                                            {msg.role === 'user' ? (
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <div className="text-sm markdown-content">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-purple-800/50 rounded-lg p-3">
                                            <Loader2 className="animate-spin" size={20} />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask me anything about recommendations..."
                            className="flex-1 bg-purple-900/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            disabled={chatLoading}
                        />
                        <button
                            type="submit"
                            disabled={chatLoading || !userInput.trim()}
                            className="btn-primary gap-2"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Recommendations;
