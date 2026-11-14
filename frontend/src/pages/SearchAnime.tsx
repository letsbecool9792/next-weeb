import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Sparkles } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import PageHeader from '../components/ui/PageHeader';
import PosterCard from '../components/ui/PosterCard';
import { GridSkeleton } from '../components/ui/Skeleton';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';

/** One search result, with the fields the backend asks MAL for */
type SearchResult = {
    id: number;
    title: string;
    main_picture?: { medium: string; large?: string };
    genres?: { id: number; name: string }[];
    num_episodes?: number;
    start_date?: string;
    mean?: number;
    media_type?: string;
};

const subtitleFor = (a: SearchResult) =>
    [a.media_type?.toUpperCase().replace('_', ' '), a.num_episodes ? `${a.num_episodes} eps` : null, a.start_date?.slice(0, 4)]
        .filter(Boolean)
        .join(' · ');

/**
 * Searches all of MyAnimeList. The query lives in the URL (?q=...), so the
 * header search box can send people here and results survive a reload.
 */
const SearchAnime = () => {
    const [params, setParams] = useSearchParams();
    const q = (params.get('q') ?? '').trim();
    const [input, setInput] = useState(q);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // A ref, not a dependency, so PostHog finishing loading does not re-run the search
    const posthog = usePostHog();
    const posthogRef = useRef(posthog);
    posthogRef.current = posthog;

    // Keep the box in step when the URL changes (e.g. a search from the header)
    useEffect(() => { setInput(q); }, [q]);

    useEffect(() => {
        if (!q) {
            setResults([]);
            setError('');
            return;
        }
        // MAL rejects shorter searches; say so instead of failing silently
        if (q.length < 3) {
            setResults([]);
            setError('Type at least 3 characters to search.');
            return;
        }

        let alive = true;
        (async () => {
            setLoading(true);
            setError('');
            try {
                // One request: the backend asks MAL for genres, episodes and start date with the results
                const res = await authFetch(`${API_URL}/api/search-anime/?q=${encodeURIComponent(q)}&limit=24`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const raw: { data?: { node: SearchResult }[] } = await res.json();
                if (!alive) return;
                const found = (raw.data ?? []).map((item) => item.node);
                setResults(found);
                posthogRef.current?.capture('anime_searched', { query: q, results_count: found.length });
            } catch {
                if (alive) {
                    setResults([]);
                    // Shown as an error, not as "no results found"
                    setError('Search failed. MyAnimeList or our server may be down; try again in a moment.');
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [q]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const next = input.trim();
        setParams(next ? { q: next } : {});
    };

    return (
        <>
            <PageHeader
                eyebrow="Search"
                kanji="探索"
                title={<>Discover <span className="text-gradient">any anime</span></>}
                subtitle="Search all of MyAnimeList. Tip: press / anywhere to jump to the search box."
            />

            <div className="px-4 sm:px-8">
                <form onSubmit={submit} className="relative mb-10 max-w-3xl">
                    <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-300/70" />
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Frieren, Bocchi, Steins;Gate..."
                        aria-label="Search anime"
                        className="input py-4 pl-14 pr-32 text-lg"
                    />
                    <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 py-2.5">Search</button>
                </form>

                {error && !loading && <p className="mb-8 text-rose-300">{error}</p>}

                {loading ? (
                    <GridSkeleton count={12} />
                ) : !q ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="icon mx-auto mb-6 h-20 w-20 rounded-3xl">
                            <Sparkles className="h-9 w-9" />
                        </motion.div>
                        <h2 className="text-2xl font-semibold">Ready to explore?</h2>
                        <p className="mx-auto mt-2 max-w-md text-purple-300/80">Search by title to find your next obsession.</p>
                    </motion.div>
                ) : !error && results.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-xl text-purple-100">No results for "{q}"</p>
                        <p className="mt-2 text-purple-300/70">Try a different title or check the spelling.</p>
                    </div>
                ) : (
                    <>
                        {results.length > 0 && <p className="mb-5 text-sm text-purple-300/70">{results.length} results for "{q}"</p>}
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {results.map((a, i) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.6), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <PosterCard
                                        to={`/anime/${a.id}`}
                                        title={a.title}
                                        image={a.main_picture?.medium}
                                        score={a.mean}
                                        subtitle={subtitleFor(a)}
                                        reason={(a.genres ?? []).slice(0, 3).map((g) => g.name).join(' · ') || undefined}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default SearchAnime;
