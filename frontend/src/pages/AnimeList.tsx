import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, LayoutGrid, Rows3, RefreshCw, Search, Star, Eye, Clock } from 'lucide-react';

import AppShell from '../components/AppShell';
import ErrorState from '../components/ErrorState';
import Poster from '../components/Poster';
import PageHeader from '../components/ui/PageHeader';
import PosterCard from '../components/ui/PosterCard';
import { GridSkeleton } from '../components/ui/Skeleton';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import { formatDate, LOAD_ERROR } from '../utils/format';
import { STATUS_COLORS, STATUS_LABELS, type ListEntry } from '../types';

const TABS = ['all', 'watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];

const SORTS: Record<string, { label: string; compare: (a: ListEntry, b: ListEntry) => number }> = {
    recently_updated: {
        label: 'Recently updated',
        compare: (a, b) => (b.last_updated ? Date.parse(b.last_updated) : 0) - (a.last_updated ? Date.parse(a.last_updated) : 0),
    },
    score: { label: 'Your score', compare: (a, b) => (b.score ?? 0) - (a.score ?? 0) },
    title: { label: 'Title', compare: (a, b) => a.title.localeCompare(b.title) },
    episodes: { label: 'Episodes watched', compare: (a, b) => (b.episodes_watched ?? 0) - (a.episodes_watched ?? 0) },
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[status] ?? 'bg-gray-500/90'}`}>
        {STATUS_LABELS[status] ?? status}
    </span>
);

const AnimeList = () => {
    const [animeList, setAnimeList] = useState<ListEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [syncMessage, setSyncMessage] = useState('');
    const [tab, setTab] = useState('all');
    const [sortBy, setSortBy] = useState('recently_updated');
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showTop, setShowTop] = useState(false);

    const loadAnime = useCallback(async () => {
        setError('');
        try {
            const res = await authFetch(`${API_URL}/api/cached-animelist/`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setAnimeList(await res.json());
        } catch {
            setError(LOAD_ERROR);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage('');
        try {
            const res = await authFetch(`${API_URL}/api/sync-animelist/`, { method: 'POST' });
            if (res.ok) {
                await loadAnime();
                setSyncMessage('Synced with MyAnimeList.');
            } else {
                setSyncMessage(res.status === 429
                    ? 'You synced a lot just now. Wait a minute and try again.'
                    : 'Sync failed. MyAnimeList may be down; try again shortly.');
            }
        } catch {
            setSyncMessage('Sync failed. Check your connection and try again.');
        } finally {
            setSyncing(false);
        }
    };

    // Load the list once. The backend runs the first sync itself when needed.
    useEffect(() => {
        loadAnime();
    }, [loadAnime]);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 800);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: animeList.length };
        animeList.forEach((a) => { c[a.status] = (c[a.status] ?? 0) + 1; });
        return c;
    }, [animeList]);

    const visible = useMemo(() => {
        const q = filter.trim().toLowerCase();
        return animeList
            .filter((a) => (tab === 'all' || a.status === tab) && (!q || a.title.toLowerCase().includes(q)))
            .sort(SORTS[sortBy].compare);
    }, [animeList, tab, filter, sortBy]);

    return (
        <AppShell>
            <PageHeader
                eyebrow="My list"
                title={<>Your anime <span className="text-gradient">collection</span></>}
                subtitle={loading ? 'Loading...' : `${animeList.length} titles, synced from MyAnimeList`}
                actions={
                    <button onClick={handleSync} disabled={syncing} className="btn-primary">
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync library'}
                    </button>
                }
            />

            <div className="px-4 sm:px-8">
                {syncMessage && <p className="mb-4 text-sm text-amber-200">{syncMessage}</p>}

                {error ? (
                    <ErrorState message={error} onRetry={loadAnime} />
                ) : loading ? (
                    <GridSkeleton />
                ) : animeList.length === 0 ? (
                    <div className="card mx-auto max-w-xl py-14 text-center">
                        <h2 className="mb-2 text-2xl font-bold">Your collection is empty</h2>
                        <p className="mb-6 text-purple-300/80">Add some anime on MyAnimeList, then sync.</p>
                        <button onClick={handleSync} disabled={syncing} className="btn-primary">
                            {syncing ? 'Syncing...' : 'Sync with MyAnimeList'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Toolbar: sticks under the header while scrolling */}
                        <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-white/5 bg-ink/80 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
                            <div className="no-scrollbar flex gap-1 overflow-x-auto">
                                {TABS.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className="relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium"
                                    >
                                        {tab === t && (
                                            <motion.span
                                                layoutId="list-tab"
                                                className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        <span className={`relative ${tab === t ? 'text-white' : 'text-purple-200/70 hover:text-white'}`}>
                                            {t === 'all' ? 'All' : STATUS_LABELS[t]}
                                            <span className="ml-1.5 opacity-60">{counts[t] ?? 0}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[200px] flex-1">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300/60" />
                                    <input
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        placeholder="Filter your list..."
                                        aria-label="Filter your list by title"
                                        className="input py-2 pl-10 text-sm"
                                    />
                                </div>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by" className="select-field">
                                    {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                                </select>
                                <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                                    {([['grid', LayoutGrid], ['list', Rows3]] as const).map(([mode, Icon]) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            aria-label={`${mode} view`}
                                            className={`rounded-full p-1.5 transition ${viewMode === mode ? 'bg-white/15 text-white' : 'text-purple-300/60 hover:text-white'}`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {visible.length === 0 ? (
                            <div className="py-16 text-center text-purple-200/80">
                                Nothing matches.{' '}
                                <button onClick={() => { setTab('all'); setFilter(''); }} className="text-pink-300 underline hover:text-pink-200">
                                    Show everything
                                </button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <motion.div layout className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                <AnimatePresence mode="popLayout">
                                    {visible.map((a) => (
                                        <motion.div
                                            key={a.mal_id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <PosterCard
                                                to={`/anime/${a.mal_id}`}
                                                title={a.title}
                                                image={a.image_url}
                                                score={a.score}
                                                badge={<StatusBadge status={a.status} />}
                                                subtitle={`${a.episodes_watched ?? 0} eps${a.is_rewatching ? ' · Rewatching' : ''}`}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div layout className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {visible.map((a) => (
                                        <motion.div
                                            key={a.mal_id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <Link
                                                to={`/anime/${a.mal_id}`}
                                                className="card group flex items-center gap-4 p-3 transition hover:border-pink-400/40 hover:bg-white/[0.07]"
                                            >
                                                <Poster src={a.image_url} title={a.title} className="h-24 w-16 shrink-0 rounded-lg object-cover" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="truncate font-semibold transition group-hover:text-pink-300">{a.title}</h3>
                                                        <StatusBadge status={a.status} />
                                                        {a.is_rewatching && <span className="chip">Rewatching</span>}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-purple-200/70">
                                                        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-300" /> {a.score || '–'}</span>
                                                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {a.episodes_watched ?? 0} episodes</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated {formatDate(a.last_updated)}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            <AnimatePresence>
                {showTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label="Back to top"
                        className="icon fixed bottom-6 right-6 z-40 rounded-full"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </AppShell>
    );
};

export default AnimeList;
