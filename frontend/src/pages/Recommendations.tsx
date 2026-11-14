import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Star, Building2, Gem, MessageCircle, Send, Loader2, RefreshCw, ListChecks, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePostHog } from 'posthog-js/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';

/** One recommended show, as the backend sends it */
type Pick = {
    id: number;
    title: string;
    image: string | null;
    score: number | null;  // MAL community score, when known
    reason: string;        // why this show was picked
};

type Recommendations = {
    top_picks: Pick[];
    because_you_liked: { anchor: string; anchor_id: number; anime: Pick[] }[];
    from_genres: { genre: string; anime: Pick[] } | null;
    from_studios: { studio: string; anime: Pick[] } | null;
    hidden_gems: Pick[];
    plan_to_watch: Pick[];
    taste: { top_genres: string[]; top_studios: string[]; favourites: string[] };
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    picks?: Pick[];  // shows the assistant suggested, as clickable cards
};

/** Poster, score badge, title and the reason it was picked */
const PickCard = ({ pick, accent = 'purple', badge }: { pick: Pick; accent?: 'purple' | 'emerald'; badge?: React.ReactNode }) => (
    <Link to={`/anime/${pick.id}`} className="group block">
        <div className={`relative overflow-hidden rounded-lg border-2 transition-all ${
            accent === 'emerald' ? 'border-emerald-500/30 group-hover:border-emerald-500' : 'border-purple-500/30 group-hover:border-purple-500'
        }`}>
            {pick.image ? (
                <img
                    src={pick.image}
                    alt={pick.title}
                    loading="lazy"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                />
            ) : (
                // MAL had no picture for this show
                <div className="w-full h-56 bg-gradient-to-br from-purple-800 to-fuchsia-900 flex items-center justify-center p-3 text-center text-sm text-purple-200">
                    {pick.title}
                </div>
            )}
            {badge}
            {pick.score != null && pick.score > 0 && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} />
                    {pick.score.toFixed(1)}
                </div>
            )}
        </div>
        <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
            {pick.title}
        </p>
        <p className="mt-1 text-xs text-purple-300/80 line-clamp-2">{pick.reason}</p>
    </Link>
);

/** A titled card holding a grid of picks. Renders nothing when empty. */
const Section = ({ icon, title, subtitle, picks, accent, badge }: {
    icon: React.ReactNode;
    title: React.ReactNode;
    subtitle?: string;
    picks: Pick[];
    accent?: 'purple' | 'emerald';
    badge?: React.ReactNode;
}) => {
    if (picks.length === 0) return null;
    return (
        <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                {icon}
                {title}
            </h2>
            {subtitle && <p className="text-purple-300 mb-4">{subtitle}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
                {picks.map((pick) => (
                    <PickCard key={pick.id} pick={pick} accent={accent} badge={badge} />
                ))}
            </div>
        </div>
    );
};

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [regenerating, setRegenerating] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const posthog = usePostHog();

    const loadRecommendations = useCallback(async (regenerate: boolean) => {
        setLoadError('');
        try {
            const res = await authFetch(`${API_URL}/api/recommendations/${regenerate ? '?regenerate=1' : ''}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data: Recommendations = await res.json();
            setRecommendations(data);

            posthog?.capture('recommendations_generated', {
                top_picks_count: data.top_picks.length,
                because_you_liked_count: data.because_you_liked.flatMap((b) => b.anime).length,
                from_genres_count: data.from_genres?.anime.length ?? 0,
                from_studios_count: data.from_studios?.anime.length ?? 0,
                hidden_gems_count: data.hidden_gems.length,
                plan_to_watch_count: data.plan_to_watch.length,
                is_regenerate: regenerate,
            });
        } catch {
            setLoadError("Couldn't load your recommendations. The server may be waking up; try again in a moment.");
        } finally {
            setLoading(false);
            setRegenerating(false);
        }
    }, [posthog]);

    useEffect(() => {
        loadRecommendations(false);
    }, [loadRecommendations]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleRegenerate = () => {
        setRegenerating(true);
        loadRecommendations(true);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || chatLoading) return;

        const userMessage = userInput.trim();
        const history: ChatMessage[] = [...chatMessages, { role: 'user', content: userMessage }];
        setUserInput('');
        setChatMessages(history);
        setChatLoading(true);

        const reply = (content: string, picks: Pick[] = []) =>
            setChatMessages(prev => [...prev, { role: 'assistant', content, picks }]);

        try {
            // The server builds the user's taste and the candidate list itself.
            // We only send the conversation. Earlier suggestions are appended as
            // text so the AI knows what it already recommended.
            const messages = history.map((m) => ({
                role: m.role,
                content: m.picks?.length
                    ? `${m.content}

(Suggested: ${m.picks.map((p) => p.title).join(', ')})`
                    : m.content,
            }));

            const res = await authFetch(`${API_URL}/api/ai-chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });

            if (res.ok) {
                const data: { message: string; picks: Pick[] } = await res.json();
                reply(data.message, data.picks);

                posthog?.capture('ai_chat_message_sent', {
                    message_length: userMessage.length,
                    turn: history.length,
                    picks_count: data.picks.length,
                });
            } else if (res.status === 429) {
                reply("You've reached the chat limit for now (20 messages an hour). Try again later.");
            } else {
                reply('Sorry, I had trouble processing that. Please try again!');
            }
        } catch {
            reply('Oops! Something went wrong. Please try again.');
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-b from-gray-900 to-fuchsia-950">
                <LoadingScreen message="Analyzing your taste..." subMessage="The first visit takes a few seconds" />
            </div>
        );
    }

    const recs = recommendations;
    const isEmpty = recs && recs.top_picks.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white">
            <Header />

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

                {loadError && (
                    <div className="card mb-8 text-center">
                        <p className="text-red-300 mb-4">{loadError}</p>
                        <button onClick={() => loadRecommendations(false)} className="btn-primary mx-auto">Try again</button>
                    </div>
                )}

                {isEmpty && (
                    <div className="card mb-8 text-center text-purple-200">
                        Rate or complete a few shows on MyAnimeList, then sync, and recommendations will appear here.
                    </div>
                )}

                {/* What the recommendations are based on */}
                {recs && recs.taste.top_genres.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Heart className="text-pink-400" size={20} />
                            What we think you like
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {recs.taste.top_genres.map((g) => (
                                <span key={g} className="px-3 py-1 rounded-full bg-purple-700/60 text-sm">{g}</span>
                            ))}
                            {recs.taste.top_studios.map((s) => (
                                <span key={s} className="px-3 py-1 rounded-full bg-blue-700/50 text-sm">{s}</span>
                            ))}
                        </div>
                        {recs.taste.favourites.length > 0 && (
                            <p className="text-sm text-purple-300 mt-3">
                                Built mostly from: {recs.taste.favourites.join(', ')}
                            </p>
                        )}
                    </div>
                )}

                {recs && (
                    <>
                        <Section
                            icon={<Sparkles className="text-yellow-400" size={28} />}
                            title="Top picks for you"
                            subtitle="The best matches across everything we considered"
                            picks={recs.top_picks}
                        />

                        {recs.because_you_liked.map((section) => (
                            <Section
                                key={section.anchor_id}
                                icon={<TrendingUp className="text-pink-400" size={28} />}
                                title={<>Because you liked <span className="text-purple-400">{section.anchor}</span></>}
                                subtitle="What MyAnimeList users who loved it recommend"
                                picks={section.anime}
                            />
                        ))}

                        <Section
                            icon={<ListChecks className="text-green-400" size={28} />}
                            title="Start next from your Plan to Watch"
                            subtitle="Your own list, ordered by how well each show fits your taste"
                            picks={recs.plan_to_watch}
                        />

                        {recs.from_genres && (
                            <Section
                                icon={<Star className="text-purple-400" size={28} />}
                                title={<>Your kind of <span className="text-pink-400">{recs.from_genres.genre}</span></>}
                                picks={recs.from_genres.anime}
                            />
                        )}

                        {recs.from_studios && (
                            <Section
                                icon={<Building2 className="text-blue-400" size={28} />}
                                title={<>More from <span className="text-blue-400">{recs.from_studios.studio}</span></>}
                                picks={recs.from_studios.anime}
                            />
                        )}

                        <Section
                            icon={<Gem className="text-emerald-400" size={28} />}
                            title="Hidden gems you'll love"
                            subtitle="Highly rated, but outside the 1,500 most popular shows"
                            picks={recs.hidden_gems}
                            accent="emerald"
                            badge={
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-400 to-emerald-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Gem size={12} />
                                    Hidden
                                </div>
                            }
                        />
                    </>
                )}

                {/* AI Chat Assistant */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <MessageCircle className="text-pink-400" size={28} />
                        Ask Our AI Assistant
                    </h2>
                    <p className="text-purple-300 mb-6">
                        Want something specific? I know your list and your taste, and only suggest shows you haven't seen.
                    </p>

                    {/* Chat Messages */}
                    <div className="bg-purple-900/30 rounded-lg p-4 mb-4 max-h-[36rem] overflow-y-auto">
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
                                    <div key={idx}>
                                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                                    {msg.picks && msg.picks.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                                            {msg.picks.map((pick) => (
                                                <PickCard key={pick.id} pick={pick} />
                                            ))}
                                        </div>
                                    )}
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
