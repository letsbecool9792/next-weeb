import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { RefreshCw, BarChart2, Clock, Film, Star, ArrowRight, Play, Sparkles } from 'lucide-react';
import ErrorState from '../components/ErrorState';
import HeroBanner from '../components/ui/HeroBanner';
import Row from '../components/ui/Row';
import PosterCard from '../components/ui/PosterCard';
import Ticker from '../components/ui/Ticker';
import CountUp from '../components/ui/CountUp';
import Reveal from '../components/ui/Reveal';
import TitleCard from '../components/ui/TitleCard';
import { HeroSkeleton, RowSkeleton } from '../components/ui/Skeleton';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import { averageScore, LOAD_ERROR } from '../utils/format';
import { STATUS_LABELS, type ListEntry, type Profile, type StatsEntry } from '../types';

const Dashboard = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [animeList, setAnimeList] = useState<ListEntry[]>([]);
    const [statsData, setStatsData] = useState<StatsEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [syncMessage, setSyncMessage] = useState('');

    const loadData = useCallback(async () => {
        setError('');
        try {
            // The three requests do not depend on each other, so run them together
            const [profileRes, animeRes, statsRes] = await Promise.all([
                authFetch(`${API_URL}/api/cached-profile/`),
                authFetch(`${API_URL}/api/cached-animelist/`),
                authFetch(`${API_URL}/api/stats-data/`),
            ]);
            if (!profileRes.ok || !animeRes.ok || !statsRes.ok) {
                throw new Error('load failed');
            }
            setProfile(await profileRes.json());
            setAnimeList(await animeRes.json());
            setStatsData(await statsRes.json());
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
            const [profileRes, listRes] = await Promise.all([
                authFetch(`${API_URL}/api/sync-profile/`, { method: 'POST' }),
                authFetch(`${API_URL}/api/sync-animelist/`, { method: 'POST' }),
            ]);
            if (listRes.status === 429 || profileRes.status === 429) {
                setSyncMessage('You synced a lot just now. Wait a minute and try again.');
            } else if (!listRes.ok || !profileRes.ok) {
                setSyncMessage('Sync failed. MyAnimeList may be down; try again shortly.');
            } else {
                await loadData();
                setSyncMessage('Synced with MyAnimeList.');
            }
        } catch {
            setSyncMessage('Sync failed. Check your connection and try again.');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <>
                <HeroSkeleton />
                <RowSkeleton />
                <RowSkeleton />
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className="pt-24" />
                <ErrorState message={error} onRetry={loadData} />
            </>
        );
    }

    // Newest first. Copy before sorting: sort() reorders in place, and this is React state.
    const updatedTime = (a: ListEntry) => (a.last_updated ? new Date(a.last_updated).getTime() : 0);
    const byRecent = [...animeList].sort((a, b) => updatedTime(b) - updatedTime(a));
    const watching = byRecent.filter((a) => a.status === 'watching');
    const planToWatch = byRecent.filter((a) => a.status === 'plan_to_watch');
    const featured = watching[0] ?? byRecent[0];

    // Quick stats, from completed shows
    const totalMinutes = statsData.reduce((t, a) => t + ((a.num_episodes || 0) * (a.average_episode_duration || 0)) / 60, 0);
    const average = averageScore(statsData.map((a) => a.score));

    const genreCounts = new Map<string, number>();
    statsData.forEach((a) => a.genres?.forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1)));
    const topGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topGenreMax = topGenres[0]?.[1] ?? 1;

    const firstName = profile?.name || 'there';

    const tiles = [
        { label: 'Completed', icon: Film, value: statsData.length, decimals: 0, empty: false },
        { label: 'Days watched', icon: Clock, value: totalMinutes / 60 / 24, decimals: 1, empty: false },
        { label: 'Average score', icon: Star, value: average ?? 0, decimals: 1, empty: average === null },
        { label: 'Watching', icon: Play, value: watching.length, decimals: 0, empty: false },
    ];

    return (
        <>
            <HeroBanner
                kanji="おかえり"
                posterCode="NW·NOW"
                image={featured?.image_large ?? featured?.image_url}
                poster={featured?.image_url ?? null}
                eyebrow={
                    featured
                        ? `Welcome back, ${firstName} · ${featured.status === 'watching' ? 'Continue watching' : 'Last updated'}`
                        : `Welcome, ${firstName}`
                }
                title={featured?.title ?? 'Your anime journey starts here'}
                meta={
                    featured && (
                        <>
                            <span className="chip">{STATUS_LABELS[featured.status] ?? featured.status}</span>
                            {featured.episodes_watched ? <span className="chip">Episode {featured.episodes_watched}</span> : null}
                            {featured.score ? (
                                <span className="chip text-amber-200">
                                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> You gave it {featured.score}
                                </span>
                            ) : null}
                        </>
                    )
                }
                description={!featured && 'Sync your MyAnimeList to see your shows here.'}
                actions={
                    <>
                        {featured && (
                            <Link to={`/anime/${featured.mal_id}`} className="btn-primary px-7 py-3">
                                <Play className="h-4 w-4 fill-white" /> View details
                            </Link>
                        )}
                        <button onClick={handleSync} disabled={syncing} className="btn-secondary px-7 py-3">
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync with MAL'}
                        </button>
                    </>
                }
            />

            {/* Stat tiles, overlapping the bottom of the banner */}
            <div className="relative z-10 -mt-6 mb-12 grid grid-cols-2 gap-4 px-4 sm:px-8 lg:grid-cols-4">
                {tiles.map((t, i) => (
                    <motion.div
                        key={t.label}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                        whileHover={{ y: -4 }}
                        className="card flex items-center justify-between p-5"
                    >
                        <div>
                            <p className="text-xs uppercase tracking-widest text-purple-300/70">{t.label}</p>
                            <p className="mt-1 text-3xl font-bold">
                                {t.empty ? '–' : <CountUp value={t.value} decimals={t.decimals} />}
                            </p>
                        </div>
                        <div className="icon h-11 w-11"><t.icon className="h-5 w-5" /></div>
                    </motion.div>
                ))}
            </div>
            {syncMessage && <p className="-mt-8 mb-8 px-4 text-sm text-amber-200 sm:px-8">{syncMessage}</p>}

            {/* Your own numbers and genres, broadcast-style */}
            <div className="mb-14">
                <Ticker
                    items={[
                        `${statsData.length} completed`,
                        `${(totalMinutes / 60 / 24).toFixed(1)} days watched`,
                        ...(average !== null ? [`average ${average.toFixed(1)}`] : []),
                        `${watching.length} watching`,
                        ...topGenres.map(([g]) => g),
                    ]}
                    tilt={-1.5}
                />
            </div>

            <Row
                ep={1}
                label="Home"
                title="Continue watching"
                action={<Link to="/animelist" className="flex items-center gap-1 text-sm text-pink-300 hover:text-pink-200">My list <ArrowRight className="h-4 w-4" /></Link>}
            >
                {watching.map((a) => (
                    <PosterCard
                        key={a.mal_id}
                        to={`/anime/${a.mal_id}`}
                        title={a.title}
                        image={a.image_url}
                        score={a.score}
                        subtitle={a.episodes_watched ? `Episode ${a.episodes_watched}` : 'Not started'}
                    />
                ))}
            </Row>

            <Row ep={2} label="Home" title="Recently updated">
                {byRecent.slice(0, 20).map((a) => (
                    <PosterCard
                        key={a.mal_id}
                        to={`/anime/${a.mal_id}`}
                        title={a.title}
                        image={a.image_url}
                        score={a.score}
                        subtitle={STATUS_LABELS[a.status] ?? a.status}
                    />
                ))}
            </Row>

            <Row
                ep={3}
                label="Home"
                title="On your Plan to Watch"
                action={<Link to="/recommendations" className="flex items-center gap-1 text-sm text-pink-300 hover:text-pink-200">Which first? <ArrowRight className="h-4 w-4" /></Link>}
            >
                {planToWatch.slice(0, 20).map((a) => (
                    <PosterCard key={a.mal_id} to={`/anime/${a.mal_id}`} title={a.title} image={a.image_url} />
                ))}
            </Row>

            <div className="grid gap-6 px-4 sm:px-8 lg:grid-cols-5">
                {/* Top genres as animated bars */}
                <Reveal className="lg:col-span-3">
                    <div className="card h-full">
                        <div className="mb-5 flex items-center justify-between">
                            <TitleCard ep={4} label="Home" title="Your top genres" />
                            <Link to="/stats" className="flex items-center gap-1 text-sm text-pink-300 hover:text-pink-200">
                                All stats <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        {topGenres.length === 0 ? (
                            <p className="text-purple-300/70">Complete a few shows to see your genres.</p>
                        ) : (
                            <div className="space-y-3">
                                {topGenres.map(([genre, count], i) => (
                                    <div key={genre}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span>{genre}</span>
                                            <span className="text-purple-300/70">{count}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${(count / topGenreMax) * 100}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Reveal>

                {/* Shortcuts */}
                <div className="grid gap-4 lg:col-span-2">
                    {[
                        { to: '/recommendations', icon: Sparkles, title: 'Discover', text: 'Picks made for your taste, plus the AI chat' },
                        { to: '/stats', icon: BarChart2, title: 'Your stats', text: 'Genres, studios, scores and watch time' },
                        { to: '/animelist', icon: Film, title: 'My list', text: `${animeList.length} shows, filter and sort` },
                    ].map((q, i) => (
                        <Reveal key={q.to} delay={i * 0.08}>
                            <Link to={q.to} className="card group flex items-center gap-4 p-5 transition hover:border-pink-400/40 hover:bg-white/[0.07]">
                                <div className="icon h-11 w-11 transition group-hover:scale-110"><q.icon className="h-5 w-5" /></div>
                                <div className="flex-1">
                                    <p className="font-semibold">{q.title}</p>
                                    <p className="text-sm text-purple-300/70">{q.text}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-purple-300/50 transition group-hover:translate-x-1 group-hover:text-pink-300" />
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Dashboard;
