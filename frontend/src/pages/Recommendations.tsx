import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Star, Building2, Gem, MessageCircle, RefreshCw, ListChecks, Heart, Play } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import AppShell from '../components/AppShell';
import ChatPanel from '../components/ChatPanel';
import ErrorState from '../components/ErrorState';
import HeroBanner from '../components/ui/HeroBanner';
import Row from '../components/ui/Row';
import PosterCard from '../components/ui/PosterCard';
import { HeroSkeleton, RowSkeleton } from '../components/ui/Skeleton';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import type { Pick } from '../types';

type Recommendations = {
    top_picks: Pick[];
    because_you_liked: { anchor: string; anchor_id: number; anime: Pick[] }[];
    from_genres: { genre: string; anime: Pick[] } | null;
    from_studios: { studio: string; anime: Pick[] } | null;
    hidden_gems: Pick[];
    plan_to_watch: Pick[];
    taste: { top_genres: string[]; top_studios: string[]; favourites: string[] };
};

const cards = (picks: Pick[], badge?: React.ReactNode) =>
    picks.map((p) => (
        <PosterCard key={p.id} to={`/anime/${p.id}`} title={p.title} image={p.image} score={p.score} reason={p.reason} badge={badge} />
    ));

const Recommendations = () => {
    const [recs, setRecs] = useState<Recommendations | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [regenerating, setRegenerating] = useState(false);
    const [generation, setGeneration] = useState(0);  // bumping it replays the row animations
    const [chatOpen, setChatOpen] = useState(false);
    const posthog = usePostHog();

    const loadRecommendations = useCallback(async (regenerate: boolean) => {
        setLoadError('');
        try {
            const res = await authFetch(`${API_URL}/api/recommendations/${regenerate ? '?regenerate=1' : ''}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Recommendations = await res.json();
            setRecs(data);
            setGeneration((g) => g + 1);

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

    const regenerate = () => {
        setRegenerating(true);
        loadRecommendations(true);
    };

    const closeChat = useCallback(() => setChatOpen(false), []);

    const hero = recs?.top_picks[0];
    const isEmpty = recs && recs.top_picks.length === 0;

    return (
        <AppShell>
            {loading ? (
                <>
                    <HeroSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                </>
            ) : loadError ? (
                <>
                    <div className="pt-24" />
                    <ErrorState message={loadError} onRetry={() => loadRecommendations(false)} />
                </>
            ) : isEmpty || !recs ? (
                <>
                    <div className="pt-24" />
                    <div className="card mx-auto my-12 max-w-xl text-center text-purple-200">
                        Rate or complete a few shows on MyAnimeList, then sync, and recommendations will appear here.
                    </div>
                </>
            ) : (
                <>
                    <HeroBanner
                        key={`hero-${generation}`}
                        image={hero?.image_large ?? hero?.image}
                        poster={hero?.image ?? null}
                        eyebrow="Your top pick"
                        title={hero?.title}
                        meta={
                            <>
                                {hero?.score ? (
                                    <span className="chip text-amber-200">
                                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> {hero.score.toFixed(2)} on MAL
                                    </span>
                                ) : null}
                                <span className="chip text-pink-100"><Sparkles className="h-3 w-3 text-pink-300" /> {hero?.reason}</span>
                            </>
                        }
                        actions={
                            <>
                                <Link to={`/anime/${hero?.id}`} className="btn-primary px-7 py-3">
                                    <Play className="h-4 w-4 fill-white" /> View details
                                </Link>
                                <button onClick={regenerate} disabled={regenerating} className="btn-secondary px-7 py-3">
                                    <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                                    {regenerating ? 'Shuffling...' : 'Regenerate'}
                                </button>
                                <button onClick={() => setChatOpen(true)} className="btn-secondary px-7 py-3">
                                    <MessageCircle className="h-4 w-4" /> Ask the AI
                                </button>
                            </>
                        }
                    />

                    {/* What the recommendations are based on */}
                    {recs.taste.top_genres.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="relative z-10 -mt-4 mb-10 px-4 sm:px-8"
                        >
                            <div className="card flex flex-col gap-3 p-5 md:flex-row md:items-center md:gap-6">
                                <p className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                                    <Heart className="h-4 w-4 text-pink-400" /> What we think you like
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {recs.taste.top_genres.map((g, i) => (
                                        <motion.span key={g} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }} className="chip border-pink-400/30 bg-pink-500/15">{g}</motion.span>
                                    ))}
                                    {recs.taste.top_studios.map((s) => (
                                        <span key={s} className="chip border-sky-400/30 bg-sky-500/15">{s}</span>
                                    ))}
                                </div>
                                {recs.taste.favourites.length > 0 && (
                                    <p className="text-xs text-purple-300/70 md:ml-auto md:text-right">
                                        Built mostly from {recs.taste.favourites.slice(0, 3).join(', ')}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <div key={`rows-${generation}`}>
                        <Row title="Top picks for you" icon={<Sparkles className="h-5 w-5 text-amber-300" />} subtitle="The best matches across everything we considered">
                            {cards(recs.top_picks.slice(1))}
                        </Row>

                        {recs.because_you_liked.map((section) => (
                            <Row
                                key={section.anchor_id}
                                title={<>Because you liked <span className="text-gradient">{section.anchor}</span></>}
                                icon={<TrendingUp className="h-5 w-5 text-pink-400" />}
                                subtitle="What MyAnimeList users who loved it recommend"
                            >
                                {cards(section.anime)}
                            </Row>
                        ))}

                        <Row title="Start next from your Plan to Watch" icon={<ListChecks className="h-5 w-5 text-emerald-400" />} subtitle="Your own list, ordered by how well each show fits your taste">
                            {cards(recs.plan_to_watch)}
                        </Row>

                        {recs.from_genres && (
                            <Row title={<>Your kind of <span className="text-gradient">{recs.from_genres.genre}</span></>} icon={<Star className="h-5 w-5 text-purple-400" />}>
                                {cards(recs.from_genres.anime)}
                            </Row>
                        )}

                        {recs.from_studios && (
                            <Row title={<>More from <span className="text-sky-300">{recs.from_studios.studio}</span></>} icon={<Building2 className="h-5 w-5 text-sky-400" />}>
                                {cards(recs.from_studios.anime)}
                            </Row>
                        )}

                        <Row title="Hidden gems" icon={<Gem className="h-5 w-5 text-emerald-400" />} subtitle="Highly rated, but outside the 1,500 most popular shows">
                            {cards(recs.hidden_gems, (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                    <Gem className="h-3 w-3" /> Gem
                                </span>
                            ))}
                        </Row>
                    </div>
                </>
            )}

            {/* Floating button that opens the AI chat */}
            <motion.button
                onClick={() => setChatOpen(true)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Open AI assistant"
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-5 py-4 font-semibold shadow-2xl shadow-pink-500/40 animate-gradient"
                style={{ backgroundSize: '200% auto' }}
            >
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-pink-500/30" />
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Ask the AI</span>
            </motion.button>

            <ChatPanel open={chatOpen} onClose={closeChat} />
        </AppShell>
    );
};

export default Recommendations;
